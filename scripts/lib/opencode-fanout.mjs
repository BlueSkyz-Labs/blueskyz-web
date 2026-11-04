/**
 * Fan-out helpers (ported from BlueSkyz-Labs/sotro, SOTRO-OPS-2026-11-04 M3/M8): DeepSeek Flash on OpenCode Go acts as sub-lead and
 * splits a grunt task into independent subtasks; each subtask runs on the free pool in parallel,
 * with a rotated starting model so parallel calls spread across models and their rate limits.
 * Pure helpers only; the CLI lives in scripts/opencode-fanout.mjs.
 */
export const MAX_SUBTASKS = 8;
export const MAX_CONCURRENCY = 5;
const ID_RE = /^[A-Za-z0-9._-]{1,40}$/;

/** Rotate a model list so subtask n starts on a different model. */
export function rotate(list, n) {
  if (!Array.isArray(list) || list.length === 0) return [];
  const k = ((n % list.length) + list.length) % list.length;
  return [...list.slice(k), ...list.slice(0, k)];
}

/** Prompt that asks the sub-lead for a JSON subtask list. */
export function splitPrompt(task, max = MAX_SUBTASKS) {
  return [
    `Split the task below into at most ${max} independent subtasks that can run in parallel without seeing each other.`,
    "Each subtask prompt must be self-contained: repeat any context, contract or file content it needs.",
    'Reply with only a JSON array, no prose: [{"id":"short-id","prompt":"..."}]',
    "",
    "TASK:",
    task,
  ].join("\n");
}

/** Validate a task list; throws on anything malformed. */
export function validateTasks(tasks, max = MAX_SUBTASKS) {
  if (!Array.isArray(tasks) || tasks.length === 0)
    throw new Error("task list must be a non-empty array");
  if (tasks.length > max) throw new Error(`at most ${max} subtasks`);
  const seen = new Set();
  return tasks.map((t) => {
    if (!t || typeof t.prompt !== "string" || !t.prompt.trim())
      throw new Error("each subtask needs a prompt");
    if (typeof t.id !== "string" || !ID_RE.test(t.id))
      throw new Error("subtask id must be 1-40 chars of A-Z a-z 0-9 . _ -");
    if (seen.has(t.id)) throw new Error(`duplicate subtask id ${t.id}`);
    seen.add(t.id);
    return { id: t.id, prompt: t.prompt };
  });
}

/** The Go worker prints a JSON envelope {"text": ...}; free-worker output is plain text. Return the text. */
export function unwrapGo(stdout) {
  const s = String(stdout ?? "").trim();
  if (!s.startsWith("{")) return s;
  try {
    const o = JSON.parse(s);
    return o && typeof o.text === "string" ? o.text : s;
  } catch {
    return s;
  }
}

/** Extract the first JSON array from sub-lead output (tolerates the Go envelope, a ```json fence or stray prose). */
export function parseSplit(text, max = MAX_SUBTASKS) {
  const s = unwrapGo(text);
  const start = s.indexOf("[");
  const end = s.lastIndexOf("]");
  if (start < 0 || end <= start)
    throw new Error("sub-lead returned no JSON array");
  let parsed;
  try {
    parsed = JSON.parse(s.slice(start, end + 1));
  } catch {
    throw new Error("sub-lead JSON did not parse");
  }
  return validateTasks(parsed, max);
}

/** Run fn over items with at most `limit` in flight; keeps input order in the result. */
export async function runPool(items, limit, fn) {
  const n = Math.max(1, Math.min(limit, MAX_CONCURRENCY));
  const out = new Array(items.length);
  let next = 0;
  async function lane() {
    while (next < items.length) {
      const i = next;
      next += 1;
      out[i] = await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, lane));
  return out;
}
