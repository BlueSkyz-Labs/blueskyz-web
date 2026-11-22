import { spawnSync } from "node:child_process";
import { readFileSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/** Where the scheduled model scan leaves the portfolio registry (control-plane projections/model-registry.json). */
export const DEFAULT_REGISTRY =
  "/mnt/project-files/model-registry/model-registry.json";

/**
 * @typedef {"go" | "zen" | "mistral"} Endpoint
 */

/**
 * @typedef {object} RegistryModel
 * @property {string} id
 * @property {string} [state]
 * @property {string[]} [callable_on]
 */

/**
 * @typedef {object} ModelRegistry
 * @property {string} [kind]
 * @property {string} [stale_after]
 * @property {RegistryModel[]} [models]
 */

/**
 * @param {string[]} modelIds
 * @param {ModelRegistry | null | undefined} registry
 * @param {Endpoint} endpoint
 * @param {Date} [now]
 * @returns {{
 *   allowed: string[],
 *   skipped: { id: string, reason: string }[],
 *   registryUsed: boolean,
 * }}
 */
export function filterCallable(modelIds, registry, endpoint, now = new Date()) {
  if (!["go", "zen", "mistral"].includes(endpoint)) {
    throw new Error("unknown endpoint");
  }

  if (registry === null || registry === undefined) {
    return {
      allowed: [...modelIds],
      skipped: [],
      registryUsed: false,
    };
  }

  const staleReason = "registry stale or invalid";
  const staleAfter =
    typeof registry.stale_after === "string"
      ? Date.parse(registry.stale_after)
      : Number.NaN;
  const nowTime = now instanceof Date ? now.getTime() : new Date(now).getTime();

  if (
    registry.kind !== "model_registry" ||
    Number.isNaN(staleAfter) ||
    Number.isNaN(nowTime) ||
    nowTime > staleAfter
  ) {
    return {
      allowed: [],
      skipped: modelIds.map((id) => ({ id, reason: staleReason })),
      registryUsed: true,
    };
  }

  const models = Array.isArray(registry.models) ? registry.models : [];
  /** @type {Map<string, RegistryModel>} */
  const modelById = new Map();

  for (const model of models) {
    if (model && typeof model.id === "string") {
      modelById.set(model.id, model);
    }
  }

  /** @type {string[]} */
  const allowed = [];
  /** @type {{ id: string, reason: string }[]} */
  const skipped = [];

  for (const id of modelIds) {
    const model = modelById.get(id);
    const state = model?.state;
    const callableOn = model?.callable_on;
    const isCallable =
      state === "AVAILABLE" &&
      Array.isArray(callableOn) &&
      callableOn.includes(endpoint);

    if (isCallable) {
      allowed.push(id);
    } else {
      skipped.push({
        id,
        reason: `${id} is ${state ?? "not in the registry"}`,
      });
    }
  }

  return { allowed, skipped, registryUsed: true };
}

/**
 * @param {string} path
 * @param {(path: string) => string | Buffer} [readFile]
 * @returns {ModelRegistry | null}
 */
export function loadRegistry(path, readFile = readFileSync) {
  try {
    const raw = readFile(path);
    const text = typeof raw === "string" ? raw : raw.toString("utf8");
    return JSON.parse(text);
  } catch {
    return null;
  }
}

const CONTROL_PLANE_FILE =
  "repos/BlueSkyz-Labs/sgps-control-plane/contents/projections/model-registry.json";
const CACHE_MAX_AGE_MS = 6 * 3600 * 1000;

/** @param {ModelRegistry | null} r @param {number} nowMs */
function fresh(r, nowMs) {
  return (
    r !== null &&
    r.kind === "model_registry" &&
    Date.parse(r.stale_after ?? "") > nowMs
  );
}

/**
 * Find the portfolio registry without anyone placing a file: an explicit MODEL_REGISTRY_FILE; else a
 * control-plane checkout (SGPS_CONTROL_PLANE_DIR or a sibling `sgps-control-plane`) or the shared mount;
 * else a local cache (6 h); else one read of the control-plane file through `gh api` (15 s limit), cached.
 * Only a fresh registry from the automatic sources is used; none found returns null (the caller warns).
 * An explicit MODEL_REGISTRY_FILE is returned as read, stale or not, so a stale one still fails closed.
 *
 * @param {Record<string, string | undefined>} [env]
 * @param {{ now?: number, readFile?: (p: string) => string | Buffer, mtime?: (p: string) => number,
 *   fetchRemote?: () => string | null, writeFile?: (p: string, t: string) => void, cwd?: string }} [deps]
 * @returns {ModelRegistry | null}
 */
export function resolveRegistry(env = process.env, deps = {}) {
  const now = deps.now ?? Date.now();
  const readFile = deps.readFile ?? readFileSync;
  const mtime = deps.mtime ?? ((p) => statSync(p).mtimeMs);
  const writeFile = deps.writeFile ?? writeFileSync;
  const cwd = deps.cwd ?? process.cwd();
  if (env.MODEL_REGISTRY_FILE)
    return loadRegistry(env.MODEL_REGISTRY_FILE, readFile);

  const rel = join("projections", "model-registry.json");
  const candidates = [
    env.SGPS_CONTROL_PLANE_DIR ? join(env.SGPS_CONTROL_PLANE_DIR, rel) : "",
    join(cwd, "..", "sgps-control-plane", rel),
    DEFAULT_REGISTRY,
  ].filter(Boolean);
  for (const path of candidates) {
    const r = loadRegistry(path, readFile);
    if (fresh(r, now)) return r;
  }

  const cache = join(tmpdir(), "sgps-model-registry.json");
  try {
    if (now - mtime(cache) < CACHE_MAX_AGE_MS) {
      const r = loadRegistry(cache, readFile);
      if (fresh(r, now)) return r;
    }
  } catch {
    /* no cache yet */
  }

  const fetchRemote =
    deps.fetchRemote ??
    (() => {
      const out = spawnSync(
        "gh",
        ["api", "-H", "Accept: application/vnd.github.raw", CONTROL_PLANE_FILE],
        { encoding: "utf8", timeout: 15_000 },
      );
      return out.status === 0 ? out.stdout : null;
    });
  try {
    const text = fetchRemote();
    if (text) {
      const r = JSON.parse(text);
      if (fresh(r, now)) {
        try {
          writeFile(cache, text);
        } catch {
          /* cache is best effort */
        }
        return r;
      }
    }
  } catch {
    /* unreachable or unreadable: caller warns, nothing is blocked */
  }
  return null;
}
