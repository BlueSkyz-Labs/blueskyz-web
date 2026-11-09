/**
 * Lead -> sub-lead -> worker routing (Owner 2026-11-08: "Lead -> Sublead điều
 * phối multi subagent harness (opencode go, escalate claude api, claude sub)").
 * Pure helpers; the CLI is scripts/lane-dispatch.mjs.
 *
 * Channel order, cheapest first: free pool -> OpenCode Go (DeepSeek Flash)
 * -> Claude API (Haiku 5.5 / Sonnet 5.5, capped) -> Claude subscription
 * (the lead or its own subagents). Each step runs only if the previous one
 * produced nothing. Work that is never delegated returns "claude_sub" at once.
 */
import { DATA_CLASSES, TASKS } from "./opencode-go-worker.mjs";

export const LANES = ["free", "go", "claude_api", "claude_sub"];
export const EXIT_CLAUDE_SUB = 4;
export const EXIT_BLOCKED = 5;
const ID_RE = /^[A-Za-z0-9._-]{1,40}$/;

/**
 * Validate one task: {id, task, complexity 1-5, data_class, prompt}.
 * Data class "personal" may go only to the Claude subscription; "secret" and
 * "unknown" are blocked everywhere (SGPS-DEC-2026-051).
 */
export function normalizeTask(t) {
  if (!t || typeof t !== "object") throw new Error("task must be an object");
  if (typeof t.id !== "string" || !ID_RE.test(t.id))
    throw new Error("task id must be 1-40 chars of A-Z a-z 0-9 . _ -");
  if (typeof t.prompt !== "string" || !t.prompt.trim())
    throw new Error("task needs a prompt");
  const complexity = t.complexity ?? 2;
  if (!Number.isInteger(complexity) || complexity < 1 || complexity > 5)
    throw new Error("complexity must be an integer 1-5");
  const dataClass = t.data_class ?? "internal_non_sensitive";
  if (![...DATA_CLASSES, "personal", "secret", "unknown"].includes(dataClass))
    throw new Error("unknown data_class");
  const task = t.task ?? "coding";
  return { id: t.id, prompt: t.prompt, complexity, dataClass, task };
}

/**
 * Ordered lanes for one task. maxLane caps the chain (for example "go" when
 * no paid call is wanted). Work outside the delegable task list, complexity 5
 * and personal data go straight to the Claude subscription.
 */
export function planLanes(t, maxLane = "claude_api") {
  if (!LANES.includes(maxLane))
    throw new Error(`--max-lane must be one of ${LANES.join(", ")}`);
  if (t.dataClass === "secret" || t.dataClass === "unknown") return [];
  if (
    t.dataClass === "personal" ||
    !TASKS.includes(t.task) ||
    t.complexity >= 5
  )
    return ["claude_sub"];
  const chain = [];
  if (t.complexity <= 3) chain.push("free");
  chain.push("go", "claude_api", "claude_sub");
  const stop = LANES.indexOf(maxLane);
  return chain.filter((l) => l === "claude_sub" || LANES.indexOf(l) <= stop);
}

/** Script and arguments for one delegated lane. */
export function laneCommand(lane, t, thread) {
  const common = [
    "--thread",
    thread,
    "--task",
    t.task,
    "--data-class",
    t.dataClass,
  ];
  if (lane === "free") return ["opencode-free-worker.mjs", common];
  if (lane === "go") return ["opencode-go-worker.mjs", common];
  if (lane === "claude_api")
    return [
      "claude-api-worker.mjs",
      [...common, "--complexity", String(t.complexity)],
    ];
  throw new Error(`lane ${lane} has no worker script`);
}

/** Route log row: lanes tried and the outcome; no prompt or output. */
export function routeRow({ id, ts, thread, t, attempts, lane, exit }) {
  return {
    id,
    ts,
    brand: "blueskyz-web",
    thread,
    task_id: t.id,
    task: t.task,
    complexity: t.complexity,
    data_class: t.dataClass,
    attempts,
    settled_lane: lane,
    exit,
  };
}
