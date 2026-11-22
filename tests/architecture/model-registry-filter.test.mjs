import assert from "node:assert/strict";
import test from "node:test";

import {
  filterCallable,
  resolveRegistry,
} from "../../scripts/lib/model-registry.mjs";

const NOW = new Date("2024-01-01T00:00:00.000Z");
const FRESH_STALE_AFTER = "2999-01-01T00:00:00.000Z";

/**
 * @param {Array<{ id: string, state?: string, callable_on?: string[] }>} models
 * @param {string} [staleAfter]
 */
function registry(models, staleAfter = FRESH_STALE_AFTER) {
  return {
    kind: "model_registry",
    stale_after: staleAfter,
    models,
  };
}

test("no registry allows every id and reports registryUsed false", () => {
  assert.deepEqual(filterCallable(["a", "b"], null, "go", NOW), {
    allowed: ["a", "b"],
    skipped: [],
    registryUsed: false,
  });
});

test("stale registry fails closed and skips every id", () => {
  const stale = registry(
    [{ id: "m1", state: "AVAILABLE", callable_on: ["go"] }],
    "2020-01-01T00:00:00.000Z",
  );

  assert.deepEqual(filterCallable(["m1"], stale, "go", NOW), {
    allowed: [],
    skipped: [{ id: "m1", reason: "registry stale or invalid" }],
    registryUsed: true,
  });
});

test("AVAILABLE model callable on zen only is not allowed on go", () => {
  const current = registry([
    { id: "zen-only", state: "AVAILABLE", callable_on: ["zen"] },
  ]);

  assert.deepEqual(filterCallable(["zen-only"], current, "go", NOW), {
    allowed: [],
    skipped: [{ id: "zen-only", reason: "zen-only is AVAILABLE" }],
    registryUsed: true,
  });
});

test("unknown id is skipped", () => {
  const current = registry([
    { id: "known", state: "AVAILABLE", callable_on: ["go"] },
  ]);

  assert.deepEqual(filterCallable(["missing"], current, "go", NOW), {
    allowed: [],
    skipped: [{ id: "missing", reason: "missing is not in the registry" }],
    registryUsed: true,
  });
});

test("retired id is skipped", () => {
  const current = registry([
    { id: "retired", state: "RETIRED", callable_on: ["go"] },
  ]);

  assert.deepEqual(filterCallable(["retired"], current, "go", NOW), {
    allowed: [],
    skipped: [{ id: "retired", reason: "retired is RETIRED" }],
    registryUsed: true,
  });
});

test("unknown endpoint throws", () => {
  assert.throws(
    () => filterCallable(["m1"], registry([]), "aws", NOW),
    /unknown endpoint/,
  );
});

test("the free worker filters its pool through the registry before any call", async () => {
  const { readFileSync } = await import("node:fs");
  const src = readFileSync("scripts/opencode-free-worker.mjs", "utf8");
  assert.match(src, /filterCallable\(/);
  assert.ok(
    src.indexOf("filterCallable(") < src.indexOf("spawnSync(bin"),
    "filtering must happen before the CLI call",
  );
});

test("seed pool carries no id that the live Go list dropped", async () => {
  const { readFileSync } = await import("node:fs");
  const seed = JSON.parse(
    readFileSync("docs/finops/free-pool.seed.json", "utf8"),
  );
  assert.ok(!seed.models.some((m) => m.id === "glm-5.3-flash-free"));
});

const NOW_MS = Date.parse("2026-11-22T05:00:00Z");
const LIVE = {
  kind: "model_registry",
  stale_after: "2026-11-24T00:00:00Z",
  models: [],
};
const none = () => {
  throw new Error("missing");
};

test("resolveRegistry uses the control-plane checkout first and never fetches", () => {
  const r = resolveRegistry(
    { SGPS_CONTROL_PLANE_DIR: "/cp" },
    {
      now: NOW_MS,
      readFile: (p) =>
        String(p).startsWith("/cp") ? JSON.stringify(LIVE) : none(),
      fetchRemote: () => {
        throw new Error("must not fetch");
      },
    },
  );
  assert.equal(r.kind, "model_registry");
});

test("resolveRegistry reads gh api once and caches when nothing is local", () => {
  let wrote = "";
  const r = resolveRegistry(
    {},
    {
      now: NOW_MS,
      readFile: none,
      mtime: none,
      fetchRemote: () => JSON.stringify(LIVE),
      writeFile: (_p, t) => {
        wrote = t;
      },
    },
  );
  assert.equal(r.kind, "model_registry");
  assert.match(wrote, /model_registry/);
});

test("resolveRegistry: stale, invalid or unreachable remote gives null, never a throw", () => {
  const base = { now: NOW_MS, readFile: none, mtime: none };
  const stale = { ...LIVE, stale_after: "2026-11-01T00:00:00Z" };
  assert.equal(
    resolveRegistry({}, { ...base, fetchRemote: () => JSON.stringify(stale) }),
    null,
  );
  assert.equal(
    resolveRegistry({}, { ...base, fetchRemote: () => "{ not json" }),
    null,
  );
  assert.equal(
    resolveRegistry(
      {},
      {
        ...base,
        fetchRemote: () => {
          throw new Error("offline");
        },
      },
    ),
    null,
  );
});

test("an explicit MODEL_REGISTRY_FILE is returned as read, even stale (fails closed)", () => {
  const stale = { ...LIVE, stale_after: "2020-01-01T00:00:00Z" };
  const r = resolveRegistry(
    { MODEL_REGISTRY_FILE: "/x" },
    { readFile: () => JSON.stringify(stale) },
  );
  assert.equal(r.stale_after, stale.stale_after);
});
