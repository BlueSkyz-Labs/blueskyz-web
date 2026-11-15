// AMG-1 (sgps-core standards/portfolio/AGENT_MEMORY_GRAPH_STANDARD.md, Golden Path GP-40..42).
// The episode log is append-only and holds no secret or personal data; the tool's own self-test
// guards its validator. Both use the Python stdlib only (no network, no graph, no model).
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const py = process.env.PYTHON || "python3";
const run = (...args) =>
  spawnSync(py, ["scripts/sgps_memory.py", ...args], { encoding: "utf8" });

test("agent memory tool self-test passes (AMG-1)", () => {
  const r = run("self-test");
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /SGPS_MEMORY_SELF_TEST_PASS/);
});

test("episode log passes check, append-only against origin/main when available (GP-40)", () => {
  const base = spawnSync(
    "git",
    ["rev-parse", "--verify", "-q", "origin/main"],
    { encoding: "utf8" },
  );
  const r =
    base.status === 0 ? run("check", "--base", "origin/main") : run("check");
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /SGPS_MEMORY_CHECK PASS/);
});

test("NEGATIVE: site source never reads the agent memory graph", () => {
  const walk = (d) =>
    readdirSync(d).flatMap((n) => {
      const p = join(d, n);
      return statSync(p).isDirectory() ? walk(p) : [p];
    });
  for (const path of walk("src")) {
    assert.doesNotMatch(
      readFileSync(path, "utf8"),
      /sgps_memory|graphiti|falkordb/i,
      `${path} must not read the memory graph`,
    );
  }
});
