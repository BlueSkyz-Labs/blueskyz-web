#!/usr/bin/env node
/**
 * Free-pool worker: measured free top 5 -> OpenCode Go -> back to the Claude lead.
 *
 *   echo "<prompt>" | node scripts/opencode-free-worker.mjs --thread lane-x [--task code_test] \
 *       [--data-class synthetic|public|internal_non_sensitive] [--start N] [--fallback-go]
 *
 * --start N rotates the pool so the attempt order begins at model N (used by
 * scripts/opencode-fanout.mjs).
 *
 * Pool: FREE_POOL_FILE, else /mnt/project-files/BLUESKYZ_WEB_FINOPS/free-pool.json,
 * else the committed seed docs/finops/free-pool.seed.json.
 * CLI: OPENCODE_BIN or `opencode` on PATH. Account key: OPENCODE_FREE_KEY_VAR
 * names the env var (default OPENCODE_GO_API_KEY_1); its value is never read here.
 * FREE_ATTEMPT_TIMEOUT_S: per-model attempt timeout, 10-600 s (default 180).
 * Exit: 0 draft on stdout; 2 usage/refused; 3 no free model and no Go fallback; else Go worker exit.
 */
import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import {
  appendFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { rotate } from "./lib/opencode-fanout.mjs";
import {
  DEFAULT_LEDGER,
  assertDataClass,
  assertTask,
  assertThread,
  checkPrompt,
} from "./lib/opencode-go-worker.mjs";
import {
  DEFAULT_KEY_VAR,
  MAX_FREE_PROMPT_CHARS,
  attemptState,
  cleanOutput,
  cliArgs,
  cliConfig,
  cliEnv,
  eligibleModels,
  goWorkerScript,
  ledgerRow,
  poolFile,
} from "./lib/opencode-free-worker.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function parse(argv) {
  const o = { task: "coding", dataClass: "synthetic" };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--fallback-go") o.fallbackGo = true;
    else if (a === "--thread") o.thread = argv[++i];
    else if (a === "--task") o.task = argv[++i];
    else if (a === "--data-class") o.dataClass = argv[++i];
    else if (a === "--start") o.start = Number(argv[++i]);
    else throw new Error(`unknown option ${a}`);
  }
  assertThread(o.thread);
  assertTask(o.task);
  assertDataClass(o.dataClass);
  if (o.start !== undefined && (!Number.isInteger(o.start) || o.start < 0))
    throw new Error("--start must be a non-negative integer");
  return o;
}

function log(file, row) {
  try {
    mkdirSync(dirname(file), { recursive: true });
    appendFileSync(file, `${JSON.stringify(row)}\n`);
  } catch {
    /* ledger is best effort */
  }
}

function main() {
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
  const refused =
    checkPrompt(prompt, process.env) ??
    (prompt.length > MAX_FREE_PROMPT_CHARS
      ? `prompt longer than ${MAX_FREE_PROMPT_CHARS}`
      : null);
  if (refused) {
    console.error(`Refused: ${refused}.`);
    return 2;
  }

  let models = [];
  try {
    const pool = JSON.parse(
      readFileSync(poolFile(process.env, repoRoot), "utf8"),
    );
    models = rotate(eligibleModels(pool, o.dataClass), o.start ?? 0);
  } catch {
    console.error("free pool file missing or unreadable; skipping free models");
  }
  const ledger = process.env.MEDIA_SPEND_LEDGER ?? DEFAULT_LEDGER;
  const bin = process.env.OPENCODE_BIN ?? "opencode";
  const keyVar = process.env.OPENCODE_FREE_KEY_VAR ?? DEFAULT_KEY_VAR;
  const timeoutS = Number(process.env.FREE_ATTEMPT_TIMEOUT_S ?? 180);
  const timeout =
    Number.isFinite(timeoutS) && timeoutS >= 10 && timeoutS <= 600
      ? timeoutS * 1000
      : 180_000;
  for (const model of models) {
    const dir = mkdtempSync(join(tmpdir(), "oc-free-"));
    writeFileSync(
      join(dir, "opencode.json"),
      JSON.stringify(cliConfig(keyVar)),
    );
    const t0 = Date.now();
    const r = spawnSync(bin, cliArgs(model, prompt), {
      cwd: dir,
      env: cliEnv(process.env, dir),
      input: "",
      encoding: "utf8",
      timeout,
      maxBuffer: 1 << 26,
    });
    rmSync(dir, { recursive: true, force: true });
    const state = attemptState({
      status: r.status,
      stdout: r.stdout,
      stderr: r.stderr,
      timedOut: r.error?.code === "ETIMEDOUT",
    });
    log(
      ledger,
      ledgerRow({
        id: `${new Date().toISOString().replace(/[-:.]/g, "").slice(0, 15)}-${randomBytes(6).toString("hex")}`,
        ts: new Date().toISOString(),
        model,
        thread: o.thread,
        task: o.task,
        state,
        latencyS: Math.round((Date.now() - t0) / 100) / 10,
      }),
    );
    if (state === "settled") {
      process.stdout.write(`${cleanOutput(r.stdout)}\n`);
      console.error(`free model: ${model}`);
      return 0;
    }
    console.error(`free model ${model}: ${state}`);
  }
  if (!o.fallbackGo) return 3;
  const g = spawnSync(
    process.execPath,
    [
      goWorkerScript(repoRoot),
      "--thread",
      o.thread,
      "--task",
      o.task,
      "--data-class",
      o.dataClass,
    ],
    { input: prompt, stdio: ["pipe", "inherit", "inherit"], env: process.env },
  );
  return g.status ?? 2;
}

process.exitCode = main();
