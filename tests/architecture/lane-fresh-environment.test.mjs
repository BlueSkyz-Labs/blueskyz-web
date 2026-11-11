import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import {
  PORTFOLIO_WORKSPACE_ID,
  workspaceId,
} from "../../scripts/lib/claude-api-worker.mjs";
import {
  DEFAULT_POOL,
  SEED_POOL,
  eligibleModels,
  poolFile,
} from "../../scripts/lib/opencode-free-worker.mjs";
import { STUDIO_REPO } from "../../scripts/lib/opencode-go-worker.mjs";

/**
 * A fresh project environment (2026-11-10: the shared files folder had no
 * free-pool.json, the studio had moved organization, and no workspace id
 * variable was set) must still reach every lane.
 */
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

test("free pool: caller file wins, then the ranked shared file, then the committed seed", () => {
  const seed = join(repoRoot, SEED_POOL);
  assert.equal(
    poolFile({ FREE_POOL_FILE: "/x/p.json" }, repoRoot, () => true),
    "/x/p.json",
  );
  assert.equal(
    poolFile({}, repoRoot, () => true),
    DEFAULT_POOL,
  );
  assert.equal(
    poolFile({}, repoRoot, (f) => f !== DEFAULT_POOL),
    seed,
  );
  const pool = JSON.parse(readFileSync(seed, "utf8"));
  assert.ok(eligibleModels(pool, "internal_non_sensitive").length >= 1);
  assert.ok(
    eligibleModels(pool, "synthetic").length >=
      eligibleModels(pool, "internal_non_sensitive").length,
  );
  for (const m of pool.models)
    assert.match(m.id, /-free$/, "seed lists free models only");
});

test("Claude API workspace: project variable, portfolio aliases, then the portfolio default", () => {
  assert.equal(
    workspaceId({
      CLAUDE_API_WORKSPACE_ID: "wrkspc_a0000001",
      CLAUDE_WORKSPACE_ID: "wrkspc_b0000001",
    }),
    "wrkspc_a0000001",
  );
  assert.equal(
    workspaceId({
      CLAUDE_WORKSPACE_ID: "wrkspc_b0000001",
      ANTHROPIC_WORKSPACE_ID: "wrkspc_c0000001",
    }),
    "wrkspc_b0000001",
  );
  assert.equal(
    workspaceId({ ANTHROPIC_WORKSPACE_ID: "wrkspc_c0000001" }),
    "wrkspc_c0000001",
  );
  assert.equal(workspaceId({}), PORTFOLIO_WORKSPACE_ID);
  assert.match(PORTFOLIO_WORKSPACE_ID, /^wrkspc_[A-Za-z0-9]{8,64}$/);
  // An explicit bad value is not silently replaced by the default.
  assert.equal(workspaceId({ CLAUDE_API_WORKSPACE_ID: "nope" }), "nope");
});

test("studio framework is cloned from the organization repository", () => {
  assert.equal(STUDIO_REPO, "https://github.com/BlueSkyz-Labs/blueskyz-studio");
});
