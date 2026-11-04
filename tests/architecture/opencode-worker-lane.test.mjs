import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import {
  BRAND,
  DEFAULT_LEDGER,
  DEFAULT_ROTATION_STATE,
  checkPrompt,
  findStudioDir,
  workerArgs,
  workerEnv,
} from "../../scripts/lib/opencode-go-worker.mjs";
import {
  attemptState,
  cleanOutput,
  cliConfig,
  cliEnv,
  eligibleModels,
  ledgerRow,
} from "../../scripts/lib/opencode-free-worker.mjs";
import {
  parseSplit,
  rotate,
  runPool,
  validateTasks,
} from "../../scripts/lib/opencode-fanout.mjs";

/**
 * OpenCode Go / free-pool worker lane (reuses blackangelz/blueskyz-studio
 * go_first.py, same mechanism as BlueSkyz-Labs/sotro). Offline only: the
 * studio worker and the OpenCode CLI are replaced by local fakes, so no
 * network call is made and no key value is read.
 */

// Fake key built at runtime so no credential-shaped literal lives in the repo.
const fakeKey = ["test", "only", "go", "slot"].join("-");
const node = process.execPath;

test("finds the studio checkout from BLUESKYZ_STUDIO_DIR or a default clone path", () => {
  const has = (p) =>
    p.startsWith("/opt/studio/") || p.startsWith("/home/user/blueskyz-studio/");
  assert.equal(
    findStudioDir({ BLUESKYZ_STUDIO_DIR: "/opt/studio" }, has),
    "/opt/studio",
  );
  assert.equal(findStudioDir({}, has), "/home/user/blueskyz-studio");
  assert.equal(
    findStudioDir({}, () => false),
    null,
  );
});

test("always runs as brand blueskyz-web with allowlisted tasks and data classes", () => {
  assert.equal(BRAND, "blueskyz-web");
  assert.deepEqual(workerArgs("/s", { thread: "lane-a", task: "code_test" }), [
    "-I",
    "/s/framework/finops/go_first.py",
    "--brand",
    "blueskyz-web",
    "--thread",
    "lane-a",
    "--task",
    "code_test",
    "--data-class",
    "internal_non_sensitive",
  ]);
  assert.throws(
    () => workerArgs("/s", { thread: "a", dataClass: "personal" }),
    /data-class/,
  );
  assert.throws(
    () => workerArgs("/s", { thread: "a", task: "public_copy" }),
    /--task/,
  );
  assert.throws(() => workerArgs("/s", { thread: "bad thread; rm" }), /thread/);
  assert.throws(() => workerArgs("/s", {}), /thread/);
  assert.ok(
    workerArgs("/s", { thread: "t", noFallback: true }).includes(
      "--no-fallback",
    ),
  );
});

test("ledger defaults to this project's files, caller values win, slot 3 is skipped by default", () => {
  const base = workerEnv({});
  assert.equal(base.MEDIA_SPEND_LEDGER, DEFAULT_LEDGER);
  assert.equal(base.OPENCODE_GO_ROTATION_STATE, DEFAULT_ROTATION_STATE);
  assert.match(DEFAULT_LEDGER, /^\/mnt\/project-files\/BLUESKYZ_WEB_FINOPS\//);
  assert.equal(
    workerEnv({ MEDIA_SPEND_LEDGER: "/x.jsonl" }).MEDIA_SPEND_LEDGER,
    "/x.jsonl",
  );
  const env = {
    OPENCODE_GO_API_KEY_1: "a",
    OPENCODE_GO_API_KEY_3: "c",
    OPENCODE_GO_ALLOWANCE_SCOPE_3: "go-sub-3",
  };
  const out = workerEnv(env);
  assert.equal(out.OPENCODE_GO_API_KEY_1, "a");
  assert.ok(!("OPENCODE_GO_API_KEY_3" in out));
  assert.ok(!("OPENCODE_GO_ALLOWANCE_SCOPE_3" in out));
  assert.equal(
    workerEnv({ ...env, BLUESKYZ_WEB_GO_DISABLED_SLOTS: "" })
      .OPENCODE_GO_API_KEY_3,
    "c",
  );
});

test("refuses prompts with secrets, key values or personal data", () => {
  const env = { OPENCODE_GO_API_KEY_2: fakeKey };
  assert.match(checkPrompt("token " + "ghp_" + "a".repeat(36), env), /secret/);
  assert.match(
    checkPrompt("Authorization: Bearer " + "x".repeat(24), env),
    /secret/,
  );
  assert.match(checkPrompt("use " + fakeKey, env), /key/);
  assert.match(checkPrompt("CCCD 0" + "79203001234", env), /personal/);
  assert.match(checkPrompt("call 09" + "12345678", env), /personal/);
  assert.match(
    checkPrompt("mail " + "jane.doe" + "@gmail.com", env),
    /personal/,
  );
  assert.match(checkPrompt("   ", env), /empty/);
  assert.equal(
    checkPrompt("Write a node:test for the static-link checker", env),
    null,
  );
  assert.equal(checkPrompt("Author dev" + "@example.com", env), null);
});

test("free pool: zdr-only for internal code, CLI locked down, key by env reference", () => {
  const pool = {
    models: [
      { id: "glm-5.3-flash-free", privacy: "zdr" },
      { id: "beam-free", privacy: "retained" },
      { id: "Bad Id" },
    ],
  };
  assert.deepEqual(eligibleModels(pool, "synthetic"), [
    "glm-5.3-flash-free",
    "beam-free",
  ]);
  assert.deepEqual(eligibleModels(pool, "internal_non_sensitive"), [
    "glm-5.3-flash-free",
  ]);
  assert.throws(() => eligibleModels(pool, "personal"), /data-class/);
  const cfg = cliConfig();
  assert.deepEqual(cfg.permission, {
    edit: "deny",
    bash: "deny",
    webfetch: "deny",
  });
  assert.equal(
    cfg.provider.opencode.options.apiKey,
    "{env:OPENCODE_GO_API_KEY_1}",
  );
  assert.throws(() => cliConfig("AWS_SECRET"), /OPENCODE_/);
  assert.equal(cliEnv({ A: "1" }, "/d").PWD, "/d");
  assert.equal(cleanOutput("\u001b[0m> build · glm\nhello\n"), "hello");
  assert.equal(attemptState({ status: 0, stdout: "x" }), "settled");
  assert.equal(
    attemptState({ status: 1, stderr: "Free usage limit reached" }),
    "free_limit",
  );
  assert.equal(attemptState({ status: null, timedOut: true }), "timeout");
  assert.equal(attemptState({ status: 0, stdout: "" }), "error");
  const row = ledgerRow({
    id: "i",
    ts: "t",
    model: "m",
    thread: "th",
    task: "coding",
    state: "settled",
    latencyS: 1,
  });
  assert.equal(row.brand, "blueskyz-web");
  assert.equal(row.billing_source, "free");
  assert.equal(row.usd, 0);
});

test("fan-out helpers rotate, validate and parse sub-lead output", async () => {
  assert.deepEqual(rotate(["a", "b", "c"], 1), ["b", "c", "a"]);
  assert.deepEqual(rotate([], 3), []);
  assert.throws(() => validateTasks([]), /non-empty/);
  assert.throws(
    () =>
      validateTasks([
        { id: "a", prompt: "x" },
        { id: "a", prompt: "y" },
      ]),
    /duplicate/,
  );
  assert.throws(
    () =>
      validateTasks(
        Array.from({ length: 9 }, (_, i) => ({ id: `t${i}`, prompt: "p" })),
      ),
    /at most/,
  );
  assert.deepEqual(
    parseSplit(
      '{"text":"```json\\n[{\\"id\\":\\"a\\",\\"prompt\\":\\"p\\"}]\\n```"}',
    ),
    [{ id: "a", prompt: "p" }],
  );
  assert.throws(() => parseSplit("no array here"), /no JSON array/);
  let inFlight = 0;
  let peak = 0;
  const out = await runPool([1, 2, 3, 4], 2, async (x) => {
    inFlight += 1;
    peak = Math.max(peak, inFlight);
    await new Promise((r) => setTimeout(r, 5));
    inFlight -= 1;
    return x * 2;
  });
  assert.deepEqual(out, [2, 4, 6, 8]);
  assert.equal(peak, 2);
});

test("CLI wiring end to end with a fake studio worker and a fake OpenCode CLI", () => {
  const dir = mkdtempSync(join(tmpdir(), "oc-lane-test-"));
  try {
    const studio = join(dir, "studio");
    mkdirSync(join(studio, "framework", "finops"), { recursive: true });
    // Fake go_first.py: echoes its argv and whether slot 3 was stripped.
    writeFileSync(
      join(studio, "framework", "finops", "go_first.py"),
      [
        "import json, os, sys",
        "sys.stdin.read()",
        'print(json.dumps({"text": "go-draft", "argv": sys.argv[1:], "slot3": "OPENCODE_GO_API_KEY_3" in os.environ}))',
      ].join("\n"),
    );
    // Fake opencode CLI: settles only when it finds the locked config in $PWD.
    const bin = join(dir, "opencode");
    writeFileSync(
      bin,
      [
        "#!/usr/bin/env node",
        "const fs = require('node:fs');",
        "const cfg = JSON.parse(fs.readFileSync(process.env.PWD + '/opencode.json', 'utf8'));",
        "if (cfg.permission.bash !== 'deny') process.exit(1);",
        "if (process.argv[4] === 'opencode/bad-free') { console.error('Free usage limit reached'); process.exit(1); }",
        "console.log('> build · ' + process.argv[4]);",
        "console.log('free-draft');",
      ].join("\n"),
    );
    chmodSync(bin, 0o755);
    const pool = join(dir, "pool.json");
    writeFileSync(
      pool,
      JSON.stringify({
        models: [
          { id: "bad-free", privacy: "zdr" },
          { id: "good-free", privacy: "zdr" },
        ],
      }),
    );
    const ledger = join(dir, "finops", "go-calls.jsonl");
    const env = {
      PATH: process.env.PATH,
      BLUESKYZ_STUDIO_DIR: studio,
      MEDIA_SPEND_LEDGER: ledger,
      OPENCODE_GO_ROTATION_STATE: join(dir, "finops", "rot.json"),
      OPENCODE_GO_API_KEY_3: fakeKey,
      OPENCODE_BIN: bin,
      FREE_POOL_FILE: pool,
    };
    const run = (script, args, input) =>
      spawnSync(node, [script, ...args], { env, input, encoding: "utf8" });

    const go = run(
      "scripts/opencode-go-worker.mjs",
      ["--thread", "t1", "--task", "code_test"],
      "write a test",
    );
    assert.equal(go.status, 0, go.stderr);
    const goOut = JSON.parse(go.stdout);
    assert.deepEqual(goOut.argv.slice(0, 2), ["--brand", "blueskyz-web"]);
    assert.equal(goOut.slot3, false);

    const refused = run(
      "scripts/opencode-go-worker.mjs",
      ["--thread", "t1"],
      "key " + fakeKey,
    );
    assert.equal(refused.status, 2);
    assert.match(refused.stderr, /Refused/);

    const free = run(
      "scripts/opencode-free-worker.mjs",
      ["--thread", "t2", "--data-class", "internal_non_sensitive"],
      "draft code",
    );
    assert.equal(free.status, 0, free.stderr);
    assert.equal(free.stdout.trim(), "free-draft");
    const rows = readFileSync(ledger, "utf8")
      .trim()
      .split("\n")
      .map((l) => JSON.parse(l));
    assert.deepEqual(
      rows.map((r) => r.state),
      ["free_limit", "settled"],
    );
    assert.ok(rows.every((r) => r.brand === "blueskyz-web" && r.usd === 0));

    writeFileSync(
      pool,
      JSON.stringify({ models: [{ id: "bad-free", privacy: "zdr" }] }),
    );
    assert.equal(
      run("scripts/opencode-free-worker.mjs", ["--thread", "t3"], "x").status,
      3,
    );
    const fallback = run(
      "scripts/opencode-free-worker.mjs",
      ["--thread", "t3", "--fallback-go"],
      "x",
    );
    assert.equal(fallback.status, 0, fallback.stderr);
    assert.equal(JSON.parse(fallback.stdout).text, "go-draft");

    const fan = run(
      "scripts/opencode-fanout.mjs",
      ["--thread", "f", "--fallback-go", "--concurrency", "2"],
      JSON.stringify([
        { id: "a", prompt: "one" },
        { id: "b", prompt: "two" },
      ]),
    );
    assert.equal(fan.status, 0, fan.stderr);
    assert.deepEqual(
      JSON.parse(fan.stdout).results.map((r) => [r.id, r.exit, r.output]),
      [
        ["a", 0, "go-draft"],
        ["b", 0, "go-draft"],
      ],
    );

    // Negative proof: without a studio checkout the lane fails closed (exit 2), no request.
    const missing = spawnSync(
      node,
      ["scripts/opencode-go-worker.mjs", "--thread", "t"],
      {
        env: { ...env, BLUESKYZ_STUDIO_DIR: join(dir, "nope") },
        input: "x",
        encoding: "utf8",
      },
    );
    assert.equal(missing.status, 2);
    assert.match(missing.stderr, /Studio framework not found/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
