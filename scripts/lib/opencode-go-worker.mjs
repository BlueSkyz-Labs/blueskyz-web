/**
 * BlueSkyz Web adapter for the shared BlueSkyz OpenCode Go worker.
 *
 * The worker is NOT reimplemented here. It is reused from the portfolio
 * framework in blackangelz/blueskyz-studio (same mechanism Sổ Trọ adopted on
 * 2026-11-02, see BlueSkyz-Labs/sotro docs/runbooks/OPENCODE_GO_WORKER.md):
 *   framework/finops/go_first.py           DeepSeek Flash latest -> MiMo Flash (transient faults only)
 *   framework/finops/go_credentials.py     3-key rotation, 429/403 cooldown (OPENCODE_GO_ROTATION_MODE=on)
 *   framework/finops/guard/spend_guard.py  ledger, caps, secret block, billing_source check
 *
 * This adapter adds only what is specific to this repository: brand
 * "blueskyz-web", a ledger in this project's shared files, a task allowlist
 * (machine-checkable engineering work only, never public copy) and a
 * fail-closed prompt check for secrets, key values and personal data.
 * Key values are never read here except to make sure a prompt does not
 * contain one.
 */
import { existsSync } from "node:fs";
import { join } from "node:path";

export const BRAND = "blueskyz-web";
export const STUDIO_REPO = "https://github.com/blackangelz/blueskyz-studio";
export const GO_FIRST = join("framework", "finops", "go_first.py");
export const GO_CREDENTIALS = join("framework", "finops", "go_credentials.py");
export const DEFAULT_STUDIO_DIRS = [
  "/home/user/blueskyz-studio",
  "/home/claude/blueskyz-studio",
  "../blueskyz-studio",
];
export const FINOPS_DIR = "/mnt/project-files/BLUESKYZ_WEB_FINOPS";
export const DEFAULT_LEDGER = `${FINOPS_DIR}/go-calls.jsonl`;
export const DEFAULT_ROTATION_STATE = `${FINOPS_DIR}/go-rotation.json`;
export const MAX_PROMPT_CHARS = 200_000;

/**
 * Engineering work a worker may draft. Public copy, legal text, product
 * claims and release/assurance verdicts stay with Claude (AGENTS.md hard
 * rules, docs/editorial/PUBLIC_CONTENT_STANDARD.md).
 */
export const TASKS = [
  "coding",
  "code_review",
  "code_test",
  "debug",
  "integration",
  "technical_docs",
];
export const DATA_CLASSES = ["synthetic", "public", "internal_non_sensitive"];

const KEY_VARS = [
  "OPENCODE_GO_API_KEY",
  "OPENCODE_GO_API_KEY_1",
  "OPENCODE_GO_API_KEY_2",
  "OPENCODE_GO_API_KEY_3",
];
const THREAD_RE = /^[A-Za-z0-9._-]{1,80}$/;

// Credential shapes. Literals that would match themselves are split so the
// repository's own scanners do not flag this file.
export const SECRET_PATTERNS = [
  /sk-[A-Za-z0-9_-]{20,}/,
  /AIza[0-9A-Za-z_-]{30,}/,
  /gh[pousr]_[A-Za-z0-9]{36}/,
  /github_pat_[A-Za-z0-9_]{22,}/,
  /AKIA[0-9A-Z]{16}/,
  /xox[baprs]-[A-Za-z0-9-]{10,}/,
  /\beyJ[A-Za-z0-9._-]{20,}/,
  /\bBearer\s+[A-Za-z0-9._-]{20,}/,
  new RegExp("-----BEGIN [A-Z ]*" + "PRIVATE KEY-----"),
  /\b(?:cloudflare|cf)[-_]?api[-_]?(?:token|key)\s*[:=]\s*\S{20,}/i,
  /\b(?:api[_-]?token|api[_-]?key|access[_-]?key|secret|password)\s*[:=]\s*["'][^"']{8,}["']/i,
];
const VN_ID_RE = /(?<!\d)\d{12}(?!\d)/;
const VN_PHONE_RE = /(?<![\d+])(?:\+84|0)(?:3|5|7|8|9)\d{8}(?!\d)/;
const EMAIL_RE =
  /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/;
// Placeholder and repository addresses that are not personal data.
const EMAIL_ALLOW_RE =
  /@(?:example\.(?:com|org|net)|users\.noreply\.github\.com|noreply\.anthropic\.com)\b/i;

/** Locate a checkout of the studio framework; null when none is present. */
export function findStudioDir(env, exists = existsSync) {
  const candidates = env.BLUESKYZ_STUDIO_DIR
    ? [env.BLUESKYZ_STUDIO_DIR]
    : DEFAULT_STUDIO_DIRS;
  return candidates.find((d) => exists(join(d, GO_FIRST))) ?? null;
}

function hasPersonalEmail(prompt) {
  const re = new RegExp(EMAIL_RE.source, "g");
  for (const m of prompt.matchAll(re)) {
    if (!EMAIL_ALLOW_RE.test(m[0])) return true;
  }
  return false;
}

/** Fail closed: no secrets, no OpenCode key values, no obvious personal data. */
export function checkPrompt(prompt, env) {
  if (typeof prompt !== "string" || !prompt.trim()) return "empty prompt";
  if (prompt.length > MAX_PROMPT_CHARS)
    return `prompt longer than ${MAX_PROMPT_CHARS} characters`;
  if (SECRET_PATTERNS.some((re) => re.test(prompt)))
    return "prompt looks like it contains a secret";
  if (
    KEY_VARS.some(
      (v) => env[v] && env[v].length >= 8 && prompt.includes(env[v]),
    )
  )
    return "prompt contains an OpenCode Go key";
  if (
    VN_ID_RE.test(prompt) ||
    VN_PHONE_RE.test(prompt) ||
    hasPersonalEmail(prompt)
  )
    return "prompt looks like it contains personal data (12-digit id, VN phone or email)";
  return null;
}

/**
 * Slots left out of rotation. Owner 2026-11-04 (recorded in Sổ Trọ): account
 * 3 has no active Go plan and none will be bought for now, so slot 3 is
 * skipped instead of producing HTTP 403 rows every cooldown. Override with
 * BLUESKYZ_WEB_GO_DISABLED_SLOTS ("" re-enables all slots).
 */
export const DEFAULT_DISABLED_SLOTS = "3";

/** Environment for the Python worker: ledger/state defaults, caller values win, disabled slots unset. */
export function workerEnv(env) {
  const out = {
    ...env,
    MEDIA_SPEND_LEDGER: env.MEDIA_SPEND_LEDGER ?? DEFAULT_LEDGER,
    OPENCODE_GO_ROTATION_STATE:
      env.OPENCODE_GO_ROTATION_STATE ?? DEFAULT_ROTATION_STATE,
  };
  const disabled = (
    env.BLUESKYZ_WEB_GO_DISABLED_SLOTS ?? DEFAULT_DISABLED_SLOTS
  )
    .split(",")
    .map((x) => x.trim())
    .filter((x) => /^[1-3]$/.test(x));
  for (const slot of disabled) {
    delete out[`OPENCODE_GO_API_KEY_${slot}`];
    delete out[`OPENCODE_GO_ALLOWANCE_SCOPE_${slot}`];
  }
  return out;
}

export function assertThread(thread) {
  if (typeof thread !== "string" || !THREAD_RE.test(thread))
    throw new Error("--thread must be 1-80 chars of A-Z a-z 0-9 . _ -");
}

export function assertDataClass(dataClass) {
  if (!DATA_CLASSES.includes(dataClass))
    throw new Error(`--data-class must be one of ${DATA_CLASSES.join(", ")}`);
}

export function assertTask(task) {
  if (!TASKS.includes(task))
    throw new Error(`--task must be one of ${TASKS.join(", ")}`);
}

/** Arguments for go_first.py. Brand is fixed; data class never above internal_non_sensitive. */
export function workerArgs(
  studioDir,
  {
    thread,
    task = "coding",
    dataClass = "internal_non_sensitive",
    noFallback = false,
  },
) {
  assertThread(thread);
  assertTask(task);
  assertDataClass(dataClass);
  const args = [
    "-I",
    join(studioDir, GO_FIRST),
    "--brand",
    BRAND,
    "--thread",
    thread,
    "--task",
    task,
    "--data-class",
    dataClass,
  ];
  if (noFallback) args.push("--no-fallback");
  return args;
}
