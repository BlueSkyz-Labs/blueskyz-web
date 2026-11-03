import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const workspace = readFileSync("pnpm-workspace.yaml", "utf8");
const lockfile = readFileSync("pnpm-lock.yaml", "utf8");

const lockedVersions = (name) =>
  [...lockfile.matchAll(new RegExp(`^  ${name}@([^:]+):$`, "gm"))].map(
    ([, version]) => version.replace(/\(.+$/, ""),
  );

const assertAllLockedAt = (name, expected) => {
  const versions = lockedVersions(name);
  assert.ok(versions.length > 0, `${name} must exist in the lockfile`);
  assert.ok(
    versions.every((version) => version === expected),
    `${name} must resolve only to ${expected}; found ${versions.join(", ")}`,
  );
};

test("tooling graph excludes known traversal and resource-exhaustion advisories", () => {
  assert.match(workspace, /overrides:/);
  assert.match(workspace, /\n\s+tmp: 0\.2\.7/);
  assert.match(workspace, /\n\s+lighthouse: 13\.4\.1/);
  assert.match(workspace, /\n\s+uuid: 11\.1\.1/);
  assert.match(workspace, /\n\s+qs: 6\.16\.1/);
  assert.match(workspace, /\n\s+sharp: 0\.35\.5/);

  assert.doesNotMatch(lockfile, /\n\s*extract-zip@/);
  assert.doesNotMatch(lockfile, /\n\s*tmp@(?:0\.1\.|0\.2\.[0-6](?:\D|$))/);
  assertAllLockedAt("uuid", "11.1.1");
  assertAllLockedAt("qs", "6.16.1");
  assertAllLockedAt("sharp", "0.35.5");
  // Issue #715: CVE-2026-118764 fixed from minimatch 11.0.1 onward.
  assert.match(workspace, /\n\s+minimatch: 11\.0\.1/);
  assertAllLockedAt("minimatch", "11.0.1");
  assert.match(lockfile, /'@isaacs\/nonrecursive-glob-match@1\.0\.3'/);
});
