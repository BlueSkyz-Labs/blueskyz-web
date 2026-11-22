import { readFileSync } from "node:fs";

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
