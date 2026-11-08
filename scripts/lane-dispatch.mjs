#!/usr/bin/env node
/**
 * Lane dispatcher: runs one task down the cheapest-first chain
 * free pool -> OpenCode Go -> Claude API -> Claude subscription.
 *
 *   echo '{"id":"t1","task":"code_test","complexity":2,"prompt":"..."}' \
 *     | node scripts/lane-dispatch.mjs --thread lane-x [--max-lane free|go|claude_api] [--start N]
 *
 * Prints JSON {id, lane, exit, output}. Exit 0 = draft produced by a cheap
 * lane; 4 = hand to the Claude subscription (the lead or its subagent);
 * 5 = blocked data class; 2 = usage/refused. Every run appends a row to
 * /mnt/project-files/BLUESKYZ_WEB_FINOPS/route-log.jsonl (or ROUTE_LOG).
 */
import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { appendFileSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { unwrapGo } from "./lib/opencode-fanout.mjs";
import {
  FINOPS_DIR,
  assertThread,
  checkPrompt,
} from "./lib/opencode-go-worker.mjs";
import {
  EXIT_BLOCKED,
  EXIT_CLAUDE_SUB,
  laneCommand,
  normalizeTask,
  planLanes,
  routeRow,
} from "./lib/lane-dispatch.mjs";

const here = dirname(fileURLToPath(import.meta.url));

function parse(argv) {
  const o = { maxLane: "claude_api" };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--thread") o.thread = argv[++i];
    else if (a === "--max-lane") o.maxLane = argv[++i];
    else if (a === "--start") o.start = Number(argv[++i]);
    else throw new Error(`unknown option ${a}`);
  }
  assertThread(o.thread);
  if (o.start !== undefined && (!Number.isInteger(o.start) || o.start < 0))
    throw new Error("--start must be a non-negative integer");
  return o;
}

function main() {
  let o;
  let t;
  try {
    o = parse(process.argv.slice(2));
    t = normalizeTask(JSON.parse(readFileSync(0, "utf8")));
  } catch (e) {
    console.error(e.message);
    return 2;
  }
  const refused = checkPrompt(t.prompt, process.env);
  if (refused) {
    console.error(`Refused: ${refused}.`);
    return 2;
  }
  let lanes;
  try {
    lanes = planLanes(t, o.maxLane);
  } catch (e) {
    console.error(e.message);
    return 2;
  }
  const thread = `${o.thread}.${t.id}`.slice(0, 80);
  const attempts = [];
  let result = { id: t.id, lane: "blocked", exit: EXIT_BLOCKED, output: "" };
  for (const lane of lanes) {
    if (lane === "claude_sub") {
      result = { id: t.id, lane, exit: EXIT_CLAUDE_SUB, output: "" };
      break;
    }
    const [script, args] = laneCommand(lane, t, thread);
    if (lane === "free" && o.start !== undefined)
      args.push("--start", String(o.start));
    const r = spawnSync(process.execPath, [join(here, script), ...args], {
      input: t.prompt,
      encoding: "utf8",
      maxBuffer: 1 << 26,
      env: process.env,
    });
    attempts.push({ lane, exit: r.status ?? 2 });
    if (r.stderr)
      process.stderr.write(
        r.stderr
          .split("\n")
          .filter(Boolean)
          .map((l) => `[${lane}] ${l}\n`)
          .join(""),
      );
    if (r.status === 0) {
      result = { id: t.id, lane, exit: 0, output: unwrapGo(r.stdout) };
      break;
    }
  }
  const log = process.env.ROUTE_LOG ?? `${FINOPS_DIR}/route-log.jsonl`;
  try {
    mkdirSync(dirname(log), { recursive: true });
    appendFileSync(
      log,
      `${JSON.stringify(routeRow({ id: randomBytes(6).toString("hex"), ts: new Date().toISOString(), thread, t, attempts, lane: result.lane, exit: result.exit }))}\n`,
    );
  } catch {
    /* route log is best effort */
  }
  process.stdout.write(`${JSON.stringify(result)}\n`);
  return result.exit;
}

process.exitCode = main();
