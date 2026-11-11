#!/usr/bin/env node
/**
 * Claude API escalation worker (paid, capped): Haiku 5.5 for complexity 1-2,
 * Sonnet 5.5 for 3-4. Complexity 5 is refused here and stays with the lead.
 *
 *   echo "<prompt>" | node scripts/claude-api-worker.mjs --thread lane-x --complexity 2 [--task coding]
 *
 * Key: the env var named by CLAUDE_API_KEY_VAR (default CLAUDE_API_KEY); never printed.
 * Workspace: CLAUDE_API_WORKSPACE_ID, else CLAUDE_WORKSPACE_ID / ANTHROPIC_WORKSPACE_ID, else the
 * portfolio workspace (the portfolio key is not scoped to one workspace).
 * Caps: BLUESKYZ_WEB_CLAUDE_API_{CALL,DAY,MONTH}_USD (defaults in scripts/lib/claude-api-worker.mjs).
 * Ledger: /mnt/project-files/BLUESKYZ_WEB_FINOPS/claude-api-calls.jsonl (or CLAUDE_API_LEDGER).
 * Exit: 0 draft on stdout; 2 usage/refused; 6 cap reached or key missing; 7 API error or model refusal.
 */
import Anthropic from "@anthropic-ai/sdk";
import { randomBytes } from "node:crypto";
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmdirSync,
} from "node:fs";
import { dirname } from "node:path";
import process from "node:process";
import {
  assertDataClass,
  assertTask,
  assertThread,
  checkPrompt,
} from "./lib/opencode-go-worker.mjs";
import {
  API_BASE_URL,
  DEFAULT_KEY_VAR,
  DEFAULT_LEDGER,
  capCheck,
  capsFrom,
  ledgerRow,
  parseLedger,
  pickModel,
  requestParams,
  reserveUsd,
  textOf,
  usageUsd,
  workspaceId,
} from "./lib/claude-api-worker.mjs";

function parse(argv) {
  const o = { task: "coding", dataClass: "internal_non_sensitive" };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--thread") o.thread = argv[++i];
    else if (a === "--task") o.task = argv[++i];
    else if (a === "--data-class") o.dataClass = argv[++i];
    else if (a === "--complexity") o.complexity = Number(argv[++i]);
    else throw new Error(`unknown option ${a}`);
  }
  assertThread(o.thread);
  assertTask(o.task);
  assertDataClass(o.dataClass);
  if (!pickModel(o.complexity))
    throw new Error("complexity 5 stays with the lead (Claude subscription)");
  return o;
}

/** Local tests may point at a loopback fake; anything else goes to the real API. */
function baseURL(env) {
  const t = env.BLUESKYZ_WEB_CLAUDE_API_TEST_BASE_URL;
  return t && /^http:\/\/127\.0\.0\.1:\d+$/.test(t) ? t : API_BASE_URL;
}

function withLock(lockDir, fn) {
  const until = Date.now() + 10_000;
  for (;;) {
    try {
      mkdirSync(lockDir);
      break;
    } catch (e) {
      if (e.code !== "EEXIST" || Date.now() > until)
        throw new Error("ledger lock busy");
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 50);
    }
  }
  try {
    return fn();
  } finally {
    rmdirSync(lockDir);
  }
}

async function main() {
  let o;
  try {
    o = parse(process.argv.slice(2));
  } catch (e) {
    console.error(e.message);
    return 2;
  }
  let prompt;
  try {
    prompt = readFileSync(0, "utf8");
  } catch {
    prompt = "";
  }
  const refused = checkPrompt(prompt, process.env);
  if (refused) {
    console.error(`Refused: ${refused}.`);
    return 2;
  }
  const keyVar = process.env.CLAUDE_API_KEY_VAR ?? DEFAULT_KEY_VAR;
  if (!/^[A-Z][A-Z0-9_]{1,60}$/.test(keyVar) || !process.env[keyVar]) {
    console.error(`Claude API key not set (${keyVar}).`);
    return 6;
  }
  const lane = pickModel(o.complexity);
  const ledger = process.env.CLAUDE_API_LEDGER ?? DEFAULT_LEDGER;
  mkdirSync(dirname(ledger), { recursive: true });
  const id = `${new Date().toISOString().replace(/[-:.]/g, "").slice(0, 15)}-${randomBytes(6).toString("hex")}`;
  const reserve = reserveUsd(lane.model, prompt.length);
  const row = (state, usd, extra = {}) =>
    ledgerRow({
      id,
      ts: new Date().toISOString(),
      model: lane.model,
      thread: o.thread,
      task: o.task,
      state,
      usd,
      ...extra,
    });

  let over;
  try {
    over = withLock(`${ledger}.lock`, () => {
      const rows = existsSync(ledger)
        ? parseLedger(readFileSync(ledger, "utf8"))
        : [];
      const reason = capCheck(rows, reserve, capsFrom(process.env));
      if (!reason)
        appendFileSync(ledger, `${JSON.stringify(row("reserved", reserve))}\n`);
      return reason;
    });
  } catch (e) {
    console.error(e.message);
    return 6;
  }
  if (over) {
    console.error(`Claude API cap: ${over}.`);
    return 6;
  }

  // An organization key that is not scoped to one workspace needs the
  // workspace id (not a secret) on every request.
  const workspace = workspaceId(process.env);
  if (workspace && !/^wrkspc_[A-Za-z0-9]{8,64}$/.test(workspace)) {
    console.error("Claude API workspace id does not look like a workspace id.");
    appendFileSync(ledger, `${JSON.stringify(row("error", 0))}\n`);
    return 6;
  }
  const client = new Anthropic({
    apiKey: process.env[keyVar],
    ...(workspace
      ? { defaultHeaders: { "anthropic-workspace-id": workspace } }
      : {}),
    baseURL: baseURL(process.env),
    maxRetries: 2,
    timeout: 300_000,
  });
  const params = requestParams(lane, prompt);
  try {
    const response = params.betas
      ? await client.beta.messages.create(params)
      : await client.messages.create(params);
    const served = response.model ?? lane.model;
    const usd = usageUsd(served, response.usage);
    appendFileSync(
      ledger,
      `${JSON.stringify(row(response.stop_reason === "refusal" ? "refusal" : "settled", usd, { model: served, usage: response.usage }))}\n`,
    );
    if (response.stop_reason === "refusal") {
      console.error(
        `Claude API refusal (${response.stop_details?.category ?? "unknown"}).`,
      );
      return 7;
    }
    const text = textOf(response);
    if (!text) {
      console.error(
        `Claude API returned no text (stop_reason ${response.stop_reason}).`,
      );
      return 7;
    }
    process.stdout.write(`${text}\n`);
    console.error(`claude api: ${served} $${usd.toFixed(4)}`);
    return 0;
  } catch (e) {
    // The call may have been billed; keep the reservation as the cost estimate.
    appendFileSync(ledger, `${JSON.stringify(row("error", reserve))}\n`);
    const status = e instanceof Anthropic.APIError ? e.status : undefined;
    console.error(
      `Claude API error${status ? ` ${status}` : ""}: ${e.constructor?.name ?? "Error"}.`,
    );
    // The API's own error text (validation reason), without the request or the key.
    const reason = e?.error?.error?.message;
    if (typeof reason === "string" && !reason.includes(process.env[keyVar]))
      console.error(`reason: ${reason.slice(0, 300)}`);
    return 7;
  }
}

process.exitCode = await main();
