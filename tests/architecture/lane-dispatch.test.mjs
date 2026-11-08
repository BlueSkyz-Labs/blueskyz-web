import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import {
  DEFAULT_CAPS,
  capCheck,
  capsFrom,
  pickModel,
  requestParams,
  reserveUsd,
  spent,
  usageUsd,
} from "../../scripts/lib/claude-api-worker.mjs";
import {
  laneCommand,
  normalizeTask,
  planLanes,
} from "../../scripts/lib/lane-dispatch.mjs";

/**
 * Lead -> sub-lead -> worker chain: free pool -> OpenCode Go -> capped Claude
 * API -> Claude subscription. Offline: the studio worker, the OpenCode CLI and
 * the Anthropic API are local fakes; no network call, no real key.
 */

const node = process.execPath;
const fakeKey = ["fake", "api", "value", "for", "tests"].join("-");

test("model choice by complexity: Haiku 1-2, Sonnet 3-4, lead keeps 5", () => {
  assert.deepEqual(pickModel(1), { model: "claude-haiku-5-5", effort: "low" });
  assert.deepEqual(pickModel(2).model, "claude-haiku-5-5");
  assert.deepEqual(pickModel(3), {
    model: "claude-sonnet-5-5",
    effort: "medium",
  });
  assert.equal(pickModel(4).model, "claude-sonnet-5-5");
  assert.equal(pickModel(5), null);
  assert.throws(() => pickModel(0), /complexity/);
  const sonnet = requestParams(pickModel(3), "x");
  assert.deepEqual(sonnet.betas, ["server-side-fallback-2026-07-01"]);
  assert.equal(sonnet.fallbacks, "default");
  assert.equal(requestParams(pickModel(1), "x").fallbacks, undefined);
  assert.ok(!("temperature" in sonnet) && !("thinking" in sonnet));
});

test("spend caps: reservations count until settled, day and month limits hold", () => {
  const now = new Date("2026-11-08T05:00:00Z");
  const rows = [
    { id: "a", ts: "2026-11-08T01:00:00Z", state: "reserved", usd: 0.3 },
    { id: "a", ts: "2026-11-08T01:00:05Z", state: "settled", usd: 0.01 },
    { id: "b", ts: "2026-11-08T02:00:00Z", state: "reserved", usd: 0.2 },
    { id: "c", ts: "2026-11-01T02:00:00Z", state: "settled", usd: 4 },
    { id: "d", ts: "2026-10-30T02:00:00Z", state: "settled", usd: 100 },
  ];
  const s = spent(rows, now);
  assert.equal(Math.round(s.day * 100) / 100, 0.21);
  assert.equal(Math.round(s.month * 100) / 100, 4.21);
  const caps = { call: 0.5, day: 5, month: 50 };
  assert.equal(capCheck(rows, 0.1, caps, now), null);
  assert.match(capCheck(rows, 0.6, caps, now), /per-call/);
  assert.match(capCheck(rows, 0.1, { ...caps, day: 0.25 }, now), /day cap/);
  assert.match(capCheck(rows, 0.1, { ...caps, month: 4.3 }, now), /month cap/);
  assert.deepEqual(capsFrom({}), DEFAULT_CAPS);
  assert.equal(capsFrom({ BLUESKYZ_WEB_CLAUDE_API_DAY_USD: "2" }).day, 2);
  assert.equal(
    capsFrom({ BLUESKYZ_WEB_CLAUDE_API_DAY_USD: "-1" }).day,
    DEFAULT_CAPS.day,
  );
  assert.ok(
    reserveUsd("claude-sonnet-5-5", 3000) >
      reserveUsd("claude-haiku-5-5", 3000),
  );
  assert.ok(
    usageUsd("unknown-model", { output_tokens: 1000 }) >
      usageUsd("claude-opus-5-5", { output_tokens: 1000 }),
  );
});

test("routing: cheapest first, personal data and complexity 5 go to the lead, secrets blocked", () => {
  const t = (o) => normalizeTask({ id: "a", prompt: "p", ...o });
  assert.deepEqual(planLanes(t({ complexity: 2 })), [
    "free",
    "go",
    "claude_api",
    "claude_sub",
  ]);
  assert.deepEqual(planLanes(t({ complexity: 4 })), [
    "go",
    "claude_api",
    "claude_sub",
  ]);
  assert.deepEqual(planLanes(t({ complexity: 2 }), "go"), [
    "free",
    "go",
    "claude_sub",
  ]);
  assert.deepEqual(planLanes(t({ complexity: 5 })), ["claude_sub"]);
  assert.deepEqual(planLanes(t({ data_class: "personal" })), ["claude_sub"]);
  assert.deepEqual(planLanes(t({ task: "public_copy" })), ["claude_sub"]);
  assert.deepEqual(planLanes(t({ data_class: "secret" })), []);
  assert.deepEqual(planLanes(t({ data_class: "unknown" })), []);
  assert.throws(() => t({ complexity: 9 }), /complexity/);
  assert.throws(() => t({ id: "bad id" }), /id/);
  assert.throws(() => planLanes(t({}), "opus"), /max-lane/);
  assert.equal(
    laneCommand("claude_api", t({ complexity: 3 }), "th")[0],
    "claude-api-worker.mjs",
  );
  assert.throws(() => laneCommand("claude_sub", t({}), "th"), /no worker/);
});

function run(args, input, env) {
  return new Promise((done) => {
    const c = spawn(node, args, { env, stdio: ["pipe", "pipe", "pipe"] });
    let out = "";
    let err = "";
    c.stdout.on("data", (d) => (out += d));
    c.stderr.on("data", (d) => (err += d));
    c.on("close", (code) => done({ status: code, stdout: out, stderr: err }));
    c.stdin.end(input);
  });
}

test("chain end to end: free and Go fail, Claude API settles within caps, then caps hand back to the lead", async () => {
  const dir = mkdtempSync(join(tmpdir(), "lane-dispatch-test-"));
  const seen = [];
  const server = createServer((req, res) => {
    let body = "";
    req.on("data", (d) => (body += d));
    req.on("end", () => {
      seen.push({
        key: req.headers.authorization === `Bearer ${fakeKey}`,
        body: JSON.parse(body),
        beta: req.headers["anthropic-beta"],
        workspace: req.headers["anthropic-workspace-id"],
      });
      res.setHeader("content-type", "application/json");
      res.end(
        JSON.stringify({
          id: "msg_1",
          type: "message",
          role: "assistant",
          model: "claude-haiku-5-5",
          content: [{ type: "text", text: "api-draft" }],
          stop_reason: "end_turn",
          usage: { input_tokens: 100, output_tokens: 200 },
        }),
      );
    });
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  try {
    const studio = join(dir, "studio");
    mkdirSync(join(studio, "framework", "finops"), { recursive: true });
    writeFileSync(
      join(studio, "framework", "finops", "go_first.py"),
      "import sys\nsys.stdin.read()\nsys.exit(1)\n",
    );
    const bin = join(dir, "opencode");
    writeFileSync(
      bin,
      "#!/usr/bin/env node\nconsole.error('Free usage limit reached');process.exit(1);\n",
    );
    chmodSync(bin, 0o755);
    const pool = join(dir, "pool.json");
    writeFileSync(
      pool,
      JSON.stringify({ models: [{ id: "only-free", privacy: "zdr" }] }),
    );
    const apiLedger = join(dir, "finops", "claude-api-calls.jsonl");
    const env = {
      PATH: process.env.PATH,
      BLUESKYZ_STUDIO_DIR: studio,
      MEDIA_SPEND_LEDGER: join(dir, "finops", "go-calls.jsonl"),
      OPENCODE_GO_ROTATION_STATE: join(dir, "finops", "rot.json"),
      OPENCODE_BIN: bin,
      FREE_POOL_FILE: pool,
      CLAUDE_API_KEY: fakeKey,
      CLAUDE_API_LEDGER: apiLedger,
      CLAUDE_API_WORKSPACE_ID: "wrkspc_testonly0001",
      ROUTE_LOG: join(dir, "finops", "route-log.jsonl"),
      BLUESKYZ_WEB_CLAUDE_API_TEST_BASE_URL: `http://127.0.0.1:${server.address().port}`,
    };
    const task = JSON.stringify({
      id: "t1",
      task: "code_test",
      complexity: 2,
      prompt: "write a test",
    });

    const ok = await run(
      ["scripts/lane-dispatch.mjs", "--thread", "lane"],
      task,
      env,
    );
    assert.equal(ok.status, 0, ok.stderr);
    assert.deepEqual(JSON.parse(ok.stdout), {
      id: "t1",
      lane: "claude_api",
      exit: 0,
      output: "api-draft",
    });
    assert.equal(seen.length, 1);
    assert.equal(seen[0].key, true);
    assert.equal(seen[0].workspace, "wrkspc_testonly0001");
    assert.equal(seen[0].body.model, "claude-haiku-5-5");
    const rows = readFileSync(apiLedger, "utf8")
      .trim()
      .split("\n")
      .map((l) => JSON.parse(l));
    assert.deepEqual(
      rows.map((r) => r.state),
      ["reserved", "settled"],
    );
    assert.ok(!readFileSync(apiLedger, "utf8").includes(fakeKey));
    assert.ok(!readFileSync(apiLedger, "utf8").includes("write a test"));
    const route = JSON.parse(readFileSync(env.ROUTE_LOG, "utf8").trim());
    assert.deepEqual(
      route.attempts.map((a) => a.lane),
      ["free", "go", "claude_api"],
    );

    // Sonnet for complexity 3-4, with server-side refusal fallbacks.
    const sonnet = await run(
      ["scripts/lane-dispatch.mjs", "--thread", "lane"],
      JSON.stringify({ id: "t2", complexity: 4, prompt: "refactor" }),
      env,
    );
    assert.equal(sonnet.status, 0, sonnet.stderr);
    assert.equal(seen[1].body.model, "claude-sonnet-5-5");
    assert.equal(seen[1].body.fallbacks, "default");
    assert.match(String(seen[1].beta), /server-side-fallback-2026-07-01/);

    // Negative proof: a day cap of zero stops the paid call and hands back to the lead.
    const capped = await run(
      ["scripts/lane-dispatch.mjs", "--thread", "lane"],
      task,
      { ...env, BLUESKYZ_WEB_CLAUDE_API_DAY_USD: "0" },
    );
    assert.equal(capped.status, 4);
    assert.equal(JSON.parse(capped.stdout).lane, "claude_sub");
    assert.match(capped.stderr, /day cap/);
    assert.equal(seen.length, 2);

    // No paid lane when --max-lane go.
    const noPaid = await run(
      ["scripts/lane-dispatch.mjs", "--thread", "lane", "--max-lane", "go"],
      task,
      env,
    );
    assert.equal(noPaid.status, 4);
    assert.equal(seen.length, 2);

    // A malformed workspace id fails closed before any request.
    const badWs = await run(
      ["scripts/claude-api-worker.mjs", "--thread", "t", "--complexity", "1"],
      "x",
      { ...env, CLAUDE_API_WORKSPACE_ID: "nope" },
    );
    assert.equal(badWs.status, 6);
    assert.equal(seen.length, 2);

    // Missing key fails closed before any request.
    const noKey = await run(
      ["scripts/claude-api-worker.mjs", "--thread", "t", "--complexity", "1"],
      "x",
      { ...env, CLAUDE_API_KEY: "" },
    );
    assert.equal(noKey.status, 6);

    // A secret in the prompt is refused before any lane runs.
    const secret = await run(
      ["scripts/lane-dispatch.mjs", "--thread", "lane"],
      JSON.stringify({ id: "t3", prompt: "key " + fakeKey }),
      { ...env, OPENCODE_GO_API_KEY_1: fakeKey },
    );
    assert.equal(secret.status, 2);
    assert.equal(seen.length, 2);

    // Fan-out with --escalate runs every subtask down the same chain in parallel.
    const fan = await run(
      [
        "scripts/opencode-fanout.mjs",
        "--thread",
        "f",
        "--escalate",
        "--concurrency",
        "2",
      ],
      JSON.stringify([
        { id: "a", prompt: "one" },
        { id: "b", prompt: "two" },
      ]),
      env,
    );
    assert.equal(fan.status, 0, fan.stderr);
    assert.deepEqual(
      JSON.parse(fan.stdout).results.map((r) => [r.id, r.lane, r.output]),
      [
        ["a", "claude_api", "api-draft"],
        ["b", "claude_api", "api-draft"],
      ],
    );
  } finally {
    server.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
