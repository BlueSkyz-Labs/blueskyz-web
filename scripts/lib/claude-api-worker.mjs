/**
 * Claude API escalation lane: the paid step after the free pool and OpenCode
 * Go, before the Claude subscription (Owner 2026-11-08: "opencode go,
 * escalate claude api, claude sub"). Pure helpers: model choice by
 * complexity, price table, spend caps from a local ledger, ledger rows.
 * The CLI is scripts/claude-api-worker.mjs.
 *
 * The key is read only from the env var named by CLAUDE_API_KEY_VAR (default
 * CLAUDE_API_KEY) and only to build the request; it is never printed or
 * written. Prompts pass the same fail-closed check as the Go lane.
 */
import { FINOPS_DIR } from "./opencode-go-worker.mjs";

export const DEFAULT_KEY_VAR = "CLAUDE_API_KEY";
export const API_BASE_URL = "https://api.anthropic.com";
export const DEFAULT_LEDGER = `${FINOPS_DIR}/claude-api-calls.jsonl`;
export const MAX_TOKENS = 16_000;

/**
 * USD per million tokens, Anthropic first-party rates (cached 2026-10-06 in
 * the claude-api skill). Unknown models are priced at the highest listed
 * rate so the caps stay conservative.
 */
export const PRICES = {
  "claude-haiku-5-5": { in: 0.1, out: 0.5 },
  "claude-sonnet-5-5": { in: 2, out: 10 },
  "claude-opus-5-5": { in: 4, out: 20 },
};
const UNKNOWN_PRICE = { in: 10, out: 50 };

/**
 * Default caps (USD, ledger estimate). They are a starting point for the
 * Owner to confirm; override with BLUESKYZ_WEB_CLAUDE_API_{CALL,DAY,MONTH}_USD.
 */
export const DEFAULT_CAPS = { call: 0.5, day: 5, month: 50 };

/** Lane model by complexity (1-5): Haiku for 1-2, Sonnet for 3-4; 5 stays with the lead. */
export function pickModel(complexity) {
  if (!Number.isInteger(complexity) || complexity < 1 || complexity > 5)
    throw new Error("complexity must be an integer 1-5");
  if (complexity <= 2) return { model: "claude-haiku-5-5", effort: "low" };
  if (complexity <= 4) return { model: "claude-sonnet-5-5", effort: "medium" };
  return null;
}

export function priceOf(model) {
  return PRICES[model] ?? UNKNOWN_PRICE;
}

/** Upper bound for one call before it is sent (about 3 characters per token). */
export function reserveUsd(model, promptChars, maxTokens = MAX_TOKENS) {
  const p = priceOf(model);
  return (Math.ceil(promptChars / 3) * p.in + maxTokens * p.out) / 1e6;
}

/** Actual cost from the response usage, priced at the model that answered. */
export function usageUsd(model, usage) {
  const p = priceOf(model);
  const input =
    (usage?.input_tokens ?? 0) +
    (usage?.cache_creation_input_tokens ?? 0) * 1.25 +
    (usage?.cache_read_input_tokens ?? 0) * 0.1;
  return (input * p.in + (usage?.output_tokens ?? 0) * p.out) / 1e6;
}

export function capsFrom(env) {
  const num = (v, d) => {
    const n = Number(v);
    return v !== undefined && v !== "" && Number.isFinite(n) && n >= 0 ? n : d;
  };
  return {
    call: num(env.BLUESKYZ_WEB_CLAUDE_API_CALL_USD, DEFAULT_CAPS.call),
    day: num(env.BLUESKYZ_WEB_CLAUDE_API_DAY_USD, DEFAULT_CAPS.day),
    month: num(env.BLUESKYZ_WEB_CLAUDE_API_MONTH_USD, DEFAULT_CAPS.month),
  };
}

/**
 * Spend so far from ledger rows. A call counts at its settled cost, or at its
 * reservation while it has not settled (so parallel calls cannot overshoot).
 */
export function spent(rows, now = new Date()) {
  const byId = new Map();
  for (const r of rows) {
    if (!r || typeof r.id !== "string") continue;
    const prev = byId.get(r.id);
    if (!prev || r.state !== "reserved") byId.set(r.id, r);
  }
  const day = now.toISOString().slice(0, 10);
  const month = day.slice(0, 7);
  let d = 0;
  let m = 0;
  for (const r of byId.values()) {
    const usd = Number(r.usd) || 0;
    if (String(r.ts).startsWith(month)) m += usd;
    if (String(r.ts).startsWith(day)) d += usd;
  }
  return { day: d, month: m };
}

/** Null when the call fits every cap, else the reason it does not. */
export function capCheck(rows, reserve, caps, now = new Date()) {
  if (reserve > caps.call)
    return `call estimate $${reserve.toFixed(3)} above per-call cap $${caps.call}`;
  const s = spent(rows, now);
  if (s.day + reserve > caps.day)
    return `day cap $${caps.day} reached ($${s.day.toFixed(3)} spent)`;
  if (s.month + reserve > caps.month)
    return `month cap $${caps.month} reached ($${s.month.toFixed(3)} spent)`;
  return null;
}

export function parseLedger(text) {
  return String(text ?? "")
    .split("\n")
    .filter(Boolean)
    .map((l) => {
      try {
        return JSON.parse(l);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

/** Ledger row: no prompt, no output, no key. */
export function ledgerRow({ id, ts, model, thread, task, state, usd, usage }) {
  return {
    id,
    ts,
    source: "claude_api",
    billing_source: "claude_api",
    brand: "blueskyz-web",
    model,
    thread,
    purpose: task,
    state,
    usd: Math.round(usd * 1e6) / 1e6,
    input_tokens: usage?.input_tokens ?? 0,
    output_tokens: usage?.output_tokens ?? 0,
  };
}

/** Request body. Sonnet opts into server-side refusal fallbacks ("default" routing). */
export function requestParams({ model, effort }, prompt) {
  const params = {
    model,
    max_tokens: MAX_TOKENS,
    output_config: { effort },
    system:
      "You are a worker drafting engineering changes for a lead engineer who reviews and tests everything. Reply with the requested code or text only.",
    messages: [{ role: "user", content: prompt }],
  };
  if (model === "claude-sonnet-5-5") {
    params.betas = ["server-side-fallback-2026-07-01"];
    params.fallbacks = "default";
  }
  return params;
}

export function textOf(response) {
  return (response?.content ?? [])
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();
}
