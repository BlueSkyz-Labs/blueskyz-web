#!/usr/bin/env node
/**
 * Fan-out worker (ported from BlueSkyz-Labs/sotro, SOTRO-OPS-2026-11-04 M3/M8): DeepSeek Flash (OpenCode Go)
 * sub-lead + free-pool sub-agents.
 *
 *   node scripts/opencode-fanout.mjs --thread lane-x --split  < big-task.txt
 *   node scripts/opencode-fanout.mjs --thread lane-x          < tasks.json   # [{"id":"a","prompt":"..."}]
 *     [--task coding] [--data-class synthetic|public|internal_non_sensitive] [--concurrency 3] [--fallback-go]
 *
 * Each subtask runs scripts/opencode-free-worker.mjs with --start <index>, so parallel subtasks begin
 * on different free models, with a 90 s per-model timeout (settled calls measured 11-20 s on
 * 2026-11-04; override with FREE_ATTEMPT_TIMEOUT_S). Prints JSON {results:[{id, exit, output}]}; the lead reviews and runs gates.
 * Exit 0 when every subtask settled, 1 when any failed, 2 on usage/refusal.
 *
 * --escalate [--complexity N] [--max-lane go|claude_api]: each subtask runs scripts/lane-dispatch.mjs
 * instead (free -> Go -> capped Claude API); a subtask that exits 4 goes back to the lead's Claude
 * subscription. With --escalate the split falls back to the Claude API (Sonnet) when Go cannot split.
 */
import { spawn, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import {
  assertDataClass,
  assertTask,
  checkPrompt,
} from "./lib/opencode-go-worker.mjs";
import {
  MAX_CONCURRENCY,
  parseSplit,
  runPool,
  splitPrompt,
  unwrapGo,
  validateTasks,
} from "./lib/opencode-fanout.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..");

function parse(argv) {
  const o = {
    task: "coding",
    dataClass: "synthetic",
    concurrency: 3,
    complexity: 2,
    maxLane: "claude_api",
  };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--split") o.split = true;
    else if (a === "--fallback-go") o.fallbackGo = true;
    else if (a === "--escalate") o.escalate = true;
    else if (a === "--complexity") o.complexity = Number(argv[++i]);
    else if (a === "--max-lane") o.maxLane = argv[++i];
    else if (a === "--thread") o.thread = argv[++i];
    else if (a === "--task") o.task = argv[++i];
    else if (a === "--data-class") o.dataClass = argv[++i];
    else if (a === "--concurrency") o.concurrency = Number(argv[++i]);
    else throw new Error(`unknown option ${a}`);
  }
  if (!o.thread || !/^[A-Za-z0-9._-]{1,39}$/.test(o.thread))
    throw new Error("--thread must be 1-39 chars of A-Z a-z 0-9 . _ -");
  assertTask(o.task);
  assertDataClass(o.dataClass);
  if (
    !Number.isInteger(o.concurrency) ||
    o.concurrency < 1 ||
    o.concurrency > MAX_CONCURRENCY
  )
    throw new Error(`--concurrency must be 1-${MAX_CONCURRENCY}`);
  if (!Number.isInteger(o.complexity) || o.complexity < 1 || o.complexity > 4)
    throw new Error("--complexity must be 1-4 (5 stays with the lead)");
  if (!["go", "claude_api"].includes(o.maxLane))
    throw new Error("--max-lane must be go or claude_api");
  return o;
}

function subLeadSplit(o, task) {
  const r = spawnSync(
    process.execPath,
    [
      join(here, "opencode-go-worker.mjs"),
      "--thread",
      `${o.thread}.split`,
      "--task",
      "technical_docs",
      "--data-class",
      o.dataClass,
    ],
    {
      input: splitPrompt(task),
      encoding: "utf8",
      maxBuffer: 1 << 26,
      stdio: ["pipe", "pipe", "inherit"],
    },
  );
  if (r.status === 0) return parseSplit(r.stdout);
  if (!o.escalate || o.maxLane !== "claude_api")
    throw new Error(`sub-lead split failed (exit ${r.status})`);
  console.error(
    `sub-lead split on Go failed (exit ${r.status}); escalating split to Claude API`,
  );
  const a = spawnSync(
    process.execPath,
    [
      join(here, "claude-api-worker.mjs"),
      "--thread",
      `${o.thread}.split`,
      "--task",
      "technical_docs",
      "--data-class",
      o.dataClass,
      "--complexity",
      "3",
    ],
    {
      input: splitPrompt(task),
      encoding: "utf8",
      maxBuffer: 1 << 26,
      stdio: ["pipe", "pipe", "inherit"],
    },
  );
  if (a.status !== 0)
    throw new Error(
      `sub-lead split failed on Go and Claude API (exit ${a.status})`,
    );
  return parseSplit(a.stdout);
}

function subArgs(o, t, i) {
  if (o.escalate)
    return [
      join(here, "lane-dispatch.mjs"),
      "--thread",
      o.thread,
      "--max-lane",
      o.maxLane,
      "--start",
      String(i),
    ];
  return [
    join(here, "opencode-free-worker.mjs"),
    "--thread",
    `${o.thread}.${t.id}`,
    "--task",
    o.task,
    "--data-class",
    o.dataClass,
    "--start",
    String(i),
  ];
}

function runSub(o, t, i) {
  const args = subArgs(o, t, i);
  if (!o.escalate && o.fallbackGo) args.push("--fallback-go");
  const input = o.escalate
    ? JSON.stringify({
        id: t.id,
        task: o.task,
        complexity: o.complexity,
        data_class: o.dataClass,
        prompt: t.prompt,
      })
    : t.prompt;
  return new Promise((done) => {
    const env = {
      ...process.env,
      FREE_ATTEMPT_TIMEOUT_S: process.env.FREE_ATTEMPT_TIMEOUT_S ?? "90",
    };
    const c = spawn(process.execPath, args, {
      cwd: repoRoot,
      env,
      stdio: ["pipe", "pipe", "pipe"],
    });
    let out = "";
    let err = "";
    c.stdout.on("data", (d) => {
      out += d;
    });
    c.stderr.on("data", (d) => {
      err += d;
    });
    c.on("close", (code) => {
      process.stderr.write(
        err
          .split("\n")
          .filter(Boolean)
          .map((l) => `[${t.id}] ${l}\n`)
          .join(""),
      );
      if (o.escalate) {
        try {
          const r = JSON.parse(out);
          done({ id: t.id, exit: code ?? 2, lane: r.lane, output: r.output });
        } catch {
          done({ id: t.id, exit: code ?? 2, lane: "error", output: "" });
        }
      } else done({ id: t.id, exit: code ?? 2, output: unwrapGo(out) });
    });
    c.stdin.end(input);
  });
}

async function main() {
  let o;
  try {
    o = parse(process.argv.slice(2));
  } catch (e) {
    console.error(e.message);
    return 2;
  }
  let input;
  try {
    input = readFileSync(0, "utf8");
  } catch {
    input = "";
  }
  const refused = checkPrompt(input, process.env);
  if (refused) {
    console.error(`Refused: ${refused}.`);
    return 2;
  }
  let tasks;
  try {
    tasks = o.split ? subLeadSplit(o, input) : validateTasks(JSON.parse(input));
  } catch (e) {
    console.error(e.message);
    return 2;
  }
  console.error(
    `fan-out: ${tasks.length} subtasks, concurrency ${o.concurrency}`,
  );
  const results = await runPool(tasks, o.concurrency, (t, i) =>
    runSub(o, t, i),
  );
  process.stdout.write(`${JSON.stringify({ results }, null, 2)}\n`);
  return results.every((r) => r.exit === 0) ? 0 : 1;
}

process.exitCode = await main();
