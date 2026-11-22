/**
 * Mistral credit lane: the prepaid step after OpenCode Go and before the paid
 * Claude API (Owner 2026-11-22: use the Go and Mistral pools to the full
 * before Claude). Pure helpers: model choice, conservative price estimate,
 * spend caps from a local ledger, ledger rows. The CLI is
 * scripts/mistral-worker.mjs.
 *
 * The key is read only from MISTRAL_API_KEY and only to build the request;
 * it is never printed or written. Prompts pass the same fail-closed check as
 * the Go lane. Mistral terms for training and retention are NOT VERIFIED
 * (sgps-core catalog privacy "unknown"), so this lane takes only data class
 * public or synthetic, never internal_non_sensitive.
 */
import { FINOPS_DIR } from "./opencode-go-worker.mjs";

export const KEY_VAR = "MISTRAL_API_KEY";
export const API_URL = "https://api.mistral.ai/v1/chat/completions";
export const DEFAULT_LEDGER = `${FINOPS_DIR}/mistral-calls.jsonl`;
export const MAX_TOKENS = 8_000;
/** Data classes this lane accepts (privacy unknown: public and synthetic only). */
export const MISTRAL_DATA_CLASSES = ["synthetic", "public"];

/**
 * Pinned ids from sgps-core protocols/model-routing-catalog.json (channel
 * mistral_api, probe 2026-11-10: codestral-2508 8/8, deepseek-v4-1-flash 7/8).
 * Never a "-latest" alias, which can move to a deprecated model.
 */
export function pickModel(complexity) {
  if (!Number.isInteger(complexity) || complexity < 1 || complexity > 5)
    throw new Error("complexity must be an integer 1-5");
  if (complexity <= 2) return { model: "codestral-2508" };
  if (complexity <= 4) return { model: "deepseek-v4-1-flash-1017" };
  return null;
}

/**
 * USD per million tokens. Mistral list prices were not re-read for this
 * file, so one deliberately high estimate covers every model; the cap
 * counts the estimate, never an unknown as zero. Replace with measured
 * rates once the Console reads the Mistral usage page.
 */
export const PRICE_ESTIMATE = { in: 2, out: 6 };

export const DEFAULT_CAPS = { call: 0.25, day: 1, month: 15 };

export function reserveUsd(promptChars, maxTokens = MAX_TOKENS) {
  return (
    (Math.ceil(promptChars / 3) * PRICE_ESTIMATE.in +
      maxTokens * PRICE_ESTIMATE.out) /
    1e6
  );
}

export function usageUsd(usage) {
  return (
    ((usage?.prompt_tokens ?? 0) * PRICE_ESTIMATE.in +
      (usage?.completion_tokens ?? 0) * PRICE_ESTIMATE.out) /
    1e6
  );
}

export function capsFrom(env) {
  const num = (v, d) => {
    const n = Number(v);
    return v !== undefined && v !== "" && Number.isFinite(n) && n >= 0 ? n : d;
  };
  return {
    call: num(env.BLUESKYZ_WEB_MISTRAL_CALL_USD, DEFAULT_CAPS.call),
    day: num(env.BLUESKYZ_WEB_MISTRAL_DAY_USD, DEFAULT_CAPS.day),
    month: num(env.BLUESKYZ_WEB_MISTRAL_MONTH_USD, DEFAULT_CAPS.month),
  };
}

export function assertMistralDataClass(dataClass) {
  if (!MISTRAL_DATA_CLASSES.includes(dataClass))
    throw new Error(
      `Mistral lane takes only data class ${MISTRAL_DATA_CLASSES.join(" or ")}`,
    );
}

/** Ledger row: no prompt, no output, no key. `source: mistral` is what the Console projection reads. */
export function ledgerRow({ id, ts, model, thread, task, state, usd, usage }) {
  return {
    id,
    ts,
    source: "mistral",
    billing_source: "mistral",
    brand: "blueskyz-web",
    model,
    thread,
    purpose: task,
    state,
    usd: Math.round(usd * 1e6) / 1e6,
    input_tokens: usage?.prompt_tokens ?? 0,
    output_tokens: usage?.completion_tokens ?? 0,
  };
}

export function requestBody({ model }, prompt) {
  return {
    model,
    max_tokens: MAX_TOKENS,
    messages: [
      {
        role: "system",
        content:
          "You are a worker drafting engineering changes for a lead engineer who reviews and tests everything. Reply with the requested code or text only.",
      },
      { role: "user", content: prompt },
    ],
  };
}

export function textOf(json) {
  const c = json?.choices?.[0]?.message?.content;
  return (typeof c === "string" ? c : "").trim();
}
