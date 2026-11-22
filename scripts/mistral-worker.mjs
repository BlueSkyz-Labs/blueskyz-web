#!/usr/bin/env node
/**
 * Mistral credit lane worker (prepaid, capped): codestral-2508 for
 * complexity 1-2, deepseek-v4-1-flash-1017 for 3-4; 5 stays with the lead.
 * Public or synthetic data only (Mistral terms NOT VERIFIED).
 *
 *   echo "<prompt>" | node scripts/mistral-worker.mjs --thread lane-x --complexity 2 [--task coding] [--data-class public]
 *
 * Key: MISTRAL_API_KEY (never printed). Caps: BLUESKYZ_WEB_MISTRAL_{CALL,DAY,MONTH}_USD.
 * Ledger: /mnt/project-files/BLUESKYZ_WEB_FINOPS/mistral-calls.jsonl (or MISTRAL_LEDGER).
 * Exit: 0 draft on stdout; 2 usage/refused; 6 cap reached or key missing; 7 API error or empty reply.
 */
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
  assertTask,
  assertThread,
  checkPrompt,
} from "./lib/opencode-go-worker.mjs";
import { capCheck, parseLedger } from "./lib/claude-api-worker.mjs";
import {
  API_URL,
  DEFAULT_LEDGER,
  KEY_VAR,
  assertMistralDataClass,
  capsFrom,
  ledgerRow,
  pickModel,
  requestBody,
  reserveUsd,
  textOf,
  usageUsd,
} from "./lib/mistral-worker.mjs";

function parse(argv) {
  const o = { task: "coding", dataClass: "public" };
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
  assertMistralDataClass(o.dataClass);
  if (!pickModel(o.complexity))
    throw new Error("complexity 5 stays with the lead (Claude subscription)");
  return o;
}

/** Local tests may point at a loopback fake; anything else goes to the real API. */
function apiUrl(env) {
  const t = env.BLUESKYZ_WEB_MISTRAL_TEST_URL;
  return t && /^http:\/\/127\.0\.0\.1:\d+\/v1\/chat\/completions$/.test(t)
    ? t
    : API_URL;
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
  const key = process.env[KEY_VAR];
  if (!key) {
    console.error(`Mistral key not set (${KEY_VAR}).`);
    return 6;
  }
  if (prompt.includes(key)) {
    console.error("Refused: prompt contains the Mistral key.");
    return 2;
  }
  const lane = pickModel(o.complexity);
  const ledger = process.env.MISTRAL_LEDGER ?? DEFAULT_LEDGER;
  mkdirSync(dirname(ledger), { recursive: true });
  const id = `${new Date().toISOString().replace(/[-:.]/g, "").slice(0, 15)}-${randomBytes(6).toString("hex")}`;
  const reserve = reserveUsd(prompt.length);
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
    console.error(`Mistral cap: ${over}.`);
    return 6;
  }

  try {
    const res = await fetch(apiUrl(process.env), {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${key}`,
      },
      body: JSON.stringify(requestBody(lane, prompt)),
      signal: AbortSignal.timeout(300_000),
    });
    if (!res.ok) {
      // 429 and 5xx are not billed; a 4xx other than 429 keeps the reservation as the estimate.
      const billed = !(res.status === 429 || res.status >= 500);
      appendFileSync(
        ledger,
        `${JSON.stringify(row(`http_${res.status}`, billed ? reserve : 0))}\n`,
      );
      console.error(`Mistral HTTP ${res.status}.`);
      return 7;
    }
    const json = await res.json();
    const usd = usageUsd(json.usage);
    const text = textOf(json);
    appendFileSync(
      ledger,
      `${JSON.stringify(row(text ? "settled" : "error", usd, { usage: json.usage, model: json.model ?? lane.model }))}\n`,
    );
    if (!text) {
      console.error("Mistral returned no text.");
      return 7;
    }
    process.stdout.write(`${text}\n`);
    console.error(`mistral: ${json.model ?? lane.model} ~$${usd.toFixed(4)}`);
    return 0;
  } catch (e) {
    appendFileSync(ledger, `${JSON.stringify(row("error", reserve))}\n`);
    console.error(`Mistral call failed (${e?.name ?? "error"}).`);
    return 7;
  }
}

process.exitCode = await main();
