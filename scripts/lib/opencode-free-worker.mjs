/**
 * Free-pool worker helpers: runs a prompt on the measured top free OpenCode
 * Zen models through the OpenCode CLI, then falls back to the Go worker.
 * Ported from BlueSkyz-Labs/sotro scripts/lib/opencode-free-worker.mjs.
 *
 * Free models are served only to the OpenCode client, and only to an
 * authenticated account from cloud egress (anonymous use returns "Free usage
 * limit reached", measured in Sổ Trọ 2026-11-04). The CLI reads the key
 * through an `{env:VAR}` reference; this module never reads or prints a key.
 */
import { existsSync } from "node:fs";
import { join } from "node:path";
import { BRAND, DATA_CLASSES, FINOPS_DIR } from "./opencode-go-worker.mjs";

export const DEFAULT_POOL = `${FINOPS_DIR}/free-pool.json`;
/** Committed seed (repository-relative), used when no ranked pool file exists. */
export const SEED_POOL = join("docs", "finops", "free-pool.seed.json");

/**
 * Pool file to read: FREE_POOL_FILE, else the ranked file in the project's
 * shared files, else the committed seed. A fresh project environment has no
 * shared file yet (measured 2026-11-10: the free lane was skipped for that
 * reason alone).
 */
export function poolFile(env, repoRoot, exists = existsSync) {
  if (env.FREE_POOL_FILE) return env.FREE_POOL_FILE;
  return exists(DEFAULT_POOL) ? DEFAULT_POOL : join(repoRoot, SEED_POOL);
}

export const DEFAULT_KEY_VAR = "OPENCODE_GO_API_KEY_1";
export const MAX_FREE_PROMPT_CHARS = 100_000;
const KEY_VAR_RE = /^OPENCODE_[A-Z0-9_]{1,40}$/;
const MODEL_RE = /^[a-z0-9][a-z0-9.-]{1,60}$/;

/** CLI config: no file edits, no shell, no web fetch; key only by env reference. */
export function cliConfig(keyVar = DEFAULT_KEY_VAR) {
  if (!KEY_VAR_RE.test(keyVar))
    throw new Error("key variable name must look like OPENCODE_*");
  return {
    $schema: "https://opencode.ai/config.json",
    permission: { edit: "deny", bash: "deny", webfetch: "deny" },
    provider: { opencode: { options: { apiKey: `{env:${keyVar}}` } } },
  };
}

/**
 * Models allowed for this data class, in pool order. Free models whose
 * privacy is not "zdr" (zero data retention) receive only public or
 * synthetic data (SGPS-DEC-2026-051).
 */
export function eligibleModels(pool, dataClass) {
  if (!DATA_CLASSES.includes(dataClass))
    throw new Error(`--data-class must be one of ${DATA_CLASSES.join(", ")}`);
  const models = Array.isArray(pool?.models) ? pool.models : [];
  return models
    .filter((m) => m && MODEL_RE.test(m.id ?? ""))
    .filter(
      (m) => dataClass !== "internal_non_sensitive" || m.privacy === "zdr",
    )
    .map((m) => m.id);
}

const ANSI_RE = /\u001b\[[0-9;]*[A-Za-z]/g;

/** Strip ANSI codes and the CLI's "> agent · model" header lines. */
export function cleanOutput(stdout) {
  return String(stdout ?? "")
    .replace(ANSI_RE, "")
    .split("\n")
    .filter((l) => !/^>\s+\S+\s+·\s+/.test(l))
    .join("\n")
    .trim();
}

/** Classify one CLI attempt. */
export function attemptState({ status, stdout, stderr, timedOut }) {
  const text = `${stdout ?? ""}\n${stderr ?? ""}`;
  if (timedOut) return "timeout";
  if (/Free usage limit reached/i.test(text)) return "free_limit";
  if (
    /Model access is disabled|not found|unknown model/i.test(text) &&
    !cleanOutput(stdout)
  )
    return "unavailable";
  if (status === 0 && cleanOutput(stdout)) return "settled";
  return "error";
}

/** Ledger row in the shared calls ledger (portal contract: source opencode_cli, no money). */
export function ledgerRow({ id, ts, model, thread, task, state, latencyS }) {
  return {
    id,
    ts,
    source: "opencode_cli",
    billing_source: "free",
    model: `opencode/${model}`,
    brand: BRAND,
    thread,
    purpose: task,
    usd: 0,
    cash_usd: 0,
    state,
    latency_s: latencyS,
  };
}

export function cliArgs(model, prompt) {
  if (!MODEL_RE.test(model)) throw new Error("bad model id");
  return ["run", "-m", `opencode/${model}`, prompt];
}

export function goWorkerScript(repoRoot) {
  return join(repoRoot, "scripts", "opencode-go-worker.mjs");
}

/**
 * Child environment for one CLI attempt. The CLI resolves its project config
 * from $PWD, not from the process cwd (measured in Sổ Trọ 2026-11-04: without
 * PWD it ignored opencode.json, ran anonymously and hit "Free usage limit
 * reached"), so PWD must point at the attempt directory.
 */
export function cliEnv(env, dir) {
  return { ...env, PWD: dir };
}
