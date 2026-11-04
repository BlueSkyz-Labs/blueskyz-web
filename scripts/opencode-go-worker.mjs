#!/usr/bin/env node
/**
 * OpenCode Go worker lane: the Claude lead directs, DeepSeek Flash drafts.
 * Thin wrapper over the shared studio worker (framework/finops/go_first.py);
 * see scripts/lib/opencode-go-worker.mjs and docs/runbooks/opencode-go-worker.md.
 *
 *   echo "Write a node:test for ..." | node scripts/opencode-go-worker.mjs --thread lane-x [--task code_test]
 *   node scripts/opencode-go-worker.mjs --status     # key slots / cooldowns, no request, no key values
 *
 * Exit codes: 0 ok, 2 usage/config/prompt refused, other = go_first.py exit (Go unavailable).
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import process from "node:process";
import {
  GO_CREDENTIALS,
  STUDIO_REPO,
  checkPrompt,
  findStudioDir,
  workerArgs,
  workerEnv,
} from "./lib/opencode-go-worker.mjs";

function parse(argv) {
  const o = {};
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--status") o.status = true;
    else if (a === "--no-fallback") o.noFallback = true;
    else if (a === "--thread") o.thread = argv[++i];
    else if (a === "--task") o.task = argv[++i];
    else if (a === "--data-class") o.dataClass = argv[++i];
    else throw new Error(`unknown option ${a}`);
  }
  return o;
}

function main() {
  let opts;
  try {
    opts = parse(process.argv.slice(2));
  } catch (e) {
    console.error(e.message);
    return 2;
  }
  const studio = findStudioDir(process.env);
  if (!studio) {
    console.error(
      `Studio framework not found. Clone it: git clone --depth 1 ${STUDIO_REPO} /home/user/blueskyz-studio (or set BLUESKYZ_STUDIO_DIR).`,
    );
    return 2;
  }
  const env = workerEnv(process.env);
  // A fresh environment has no FinOps folder yet; the studio scripts do not create it.
  for (const f of [env.MEDIA_SPEND_LEDGER, env.OPENCODE_GO_ROTATION_STATE]) {
    try {
      mkdirSync(dirname(f), { recursive: true });
    } catch {
      /* reported by the worker */
    }
  }
  if (opts.status) {
    const r = spawnSync(
      "python3",
      ["-I", join(studio, GO_CREDENTIALS), "status"],
      { env, stdio: "inherit" },
    );
    return r.status ?? 2;
  }
  let args;
  try {
    args = workerArgs(studio, opts);
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
  const r = spawnSync("python3", args, {
    env,
    input: prompt,
    stdio: ["pipe", "inherit", "inherit"],
    maxBuffer: 1 << 26,
  });
  return r.status ?? 2;
}

process.exitCode = main();
