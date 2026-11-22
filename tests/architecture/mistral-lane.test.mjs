import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  laneCommand,
  normalizeTask,
  planLanes,
} from "../../scripts/lib/lane-dispatch.mjs";
import {
  capsFrom,
  ledgerRow,
  pickModel,
  reserveUsd,
  usageUsd,
} from "../../scripts/lib/mistral-worker.mjs";

const node = process.execPath;
const t = (o) => normalizeTask({ id: "a", prompt: "p", ...o });

test("Mistral sits after Go and before the Claude API, for public and synthetic data only", () => {
  assert.deepEqual(planLanes(t({ complexity: 2, data_class: "public" })), [
    "free",
    "go",
    "mistral",
    "claude_api",
    "claude_sub",
  ]);
  assert.deepEqual(planLanes(t({ complexity: 4, data_class: "synthetic" })), [
    "go",
    "mistral",
    "claude_api",
    "claude_sub",
  ]);
  // negative proof: privacy unknown, so internal data never reaches Mistral
  assert.ok(!planLanes(t({ complexity: 2 })).includes("mistral"));
  assert.deepEqual(
    planLanes(t({ complexity: 4, data_class: "public" }), "go"),
    ["go", "claude_sub"],
  );
  assert.equal(
    laneCommand("mistral", t({ complexity: 3 }), "th")[0],
    "mistral-worker.mjs",
  );
});

test("pinned model by complexity, conservative estimate, caps from env", () => {
  assert.equal(pickModel(1).model, "codestral-2508");
  assert.equal(pickModel(3).model, "deepseek-v4-1-flash-1017");
  assert.equal(pickModel(5), null);
  assert.ok(!pickModel(2).model.includes("latest"));
  assert.ok(reserveUsd(3000) > 0 && usageUsd({}) === 0);
  assert.deepEqual(capsFrom({ BLUESKYZ_WEB_MISTRAL_MONTH_USD: "7" }), {
    call: 0.25,
    day: 1,
    month: 7,
  });
  const r = ledgerRow({
    id: "i",
    ts: "2026-11-22T00:00:00Z",
    model: "m",
    thread: "th",
    task: "coding",
    state: "settled",
    usd: 0.001,
    usage: { prompt_tokens: 5, completion_tokens: 7 },
  });
  assert.equal(r.source, "mistral");
  assert.ok(!("prompt" in r) && !("output" in r));
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

test("worker: settles against a loopback fake, writes the ledger, refuses internal data, stops at the cap", async () => {
  let seen;
  const server = createServer((req, res) => {
    let b = "";
    req.on("data", (d) => (b += d));
    req.on("end", () => {
      seen = { auth: req.headers.authorization, body: JSON.parse(b) };
      res.setHeader("content-type", "application/json");
      res.end(
        JSON.stringify({
          model: "codestral-2508",
          choices: [{ message: { content: "draft-text" } }],
          usage: { prompt_tokens: 10, completion_tokens: 20 },
        }),
      );
    });
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const dir = mkdtempSync(join(tmpdir(), "mistral-"));
  const ledger = join(dir, "mistral-calls.jsonl");
  const env = {
    PATH: process.env.PATH,
    MISTRAL_API_KEY: "test-key-not-a-secret-0000",
    MISTRAL_LEDGER: ledger,
    BLUESKYZ_WEB_MISTRAL_TEST_URL: `http://127.0.0.1:${server.address().port}/v1/chat/completions`,
  };
  const base = ["scripts/mistral-worker.mjs", "--thread", "lane-t"];
  try {
    const ok = await run(
      [...base, "--complexity", "2", "--data-class", "public"],
      "write add()",
      env,
    );
    assert.equal(ok.status, 0, ok.stderr);
    assert.equal(ok.stdout.trim(), "draft-text");
    assert.equal(seen.body.model, "codestral-2508");
    assert.match(seen.auth, /^Bearer /);
    const rows = readFileSync(ledger, "utf8")
      .trim()
      .split("\n")
      .map(JSON.parse);
    assert.deepEqual(
      rows.map((r) => r.state),
      ["reserved", "settled"],
    );
    assert.ok(!JSON.stringify(rows).includes("test-key-not-a-secret"));
    assert.ok(!JSON.stringify(rows).includes("write add()"));

    const internal = await run(
      [...base, "--complexity", "2", "--data-class", "internal_non_sensitive"],
      "x",
      env,
    );
    assert.equal(internal.status, 2);

    const nokey = await run([...base, "--complexity", "2"], "x", {
      ...env,
      MISTRAL_API_KEY: "",
    });
    assert.equal(nokey.status, 6);

    writeFileSync(
      ledger,
      `${JSON.stringify({ id: "old", ts: new Date().toISOString(), state: "settled", usd: 20 })}\n`,
    );
    const capped = await run([...base, "--complexity", "2"], "x", env);
    assert.equal(capped.status, 6);
    assert.match(capped.stderr, /cap/);
  } finally {
    server.close();
  }
});
