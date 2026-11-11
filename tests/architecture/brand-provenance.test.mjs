import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const kitRoot = "brand/blueskyz-production-v4";
const standardsPath = `${kitRoot}/00_START_HERE/BRAND_STANDARDS.md`;
const checksumsPath = `${kitRoot}/00_START_HERE/SHA256SUMS.txt`;

test("Production v4 source kit preserves release provenance", () => {
  assert.equal(
    readFileSync(`${kitRoot}/00_START_HERE/VERSION.txt`, "utf8").trim(),
    "BlueSkyz Labs Brand Kit\nVersion: 4.0.0\nRelease date: 2026-09-07\nStatus: Production candidate - verified for digital deployment",
  );
  assert.match(readFileSync(standardsPath, "utf8"), /blueskyzlabs\.com/i);
  assert.equal(existsSync(checksumsPath), true);
  assert.match(readFileSync(checksumsPath, "utf8"), /02_LOGOS\/01_VECTOR_SVG/);
});

test("Production v4 canonical masters are present and checksum-verifiable", () => {
  const files = [
    "02_LOGOS/01_VECTOR_SVG/FULL_LOCKUPS/blueskyzlabs_horizontal_flat_light.svg",
    "02_LOGOS/01_VECTOR_SVG/FULL_LOCKUPS/blueskyzlabs_horizontal_reverse_white.svg",
    "02_LOGOS/02_PNG_TRANSPARENT/blueskyzlabs_prismatic_full_lockup_transparent.png",
    "03_ICONS/01_FAVICON_PWA/favicon.ico",
    "03_ICONS/03_PRODUCT_ICONS/apexagent.svg",
  ];
  const checksums = readFileSync(checksumsPath, "utf8");
  for (const relativePath of files) {
    const path = `${kitRoot}/${relativePath}`;
    assert.equal(existsSync(path), true, `${path} must exist`);
    const digest = createHash("sha256")
      .update(readFileSync(path))
      .digest("hex");
    assert.match(checksums, new RegExp(`${digest}\\s+${relativePath}`));
  }
});

test("header and footer use Brand Kit v5 lockups", () => {
  const lockup = readFileSync("src/components/brand/BrandLockup.astro", "utf8");
  assert.match(
    lockup,
    /\/brand\/blueskyz\/v5\/logos\/lockup-compact-labs-paper\.svg/,
  );
  assert.match(
    lockup,
    /\/brand\/blueskyz\/v5\/logos\/lockup-compact-labs-night\.svg/,
  );
  assert.doesNotMatch(lockup, /SITE\.name/);
  for (const path of [
    "src/components/layout/Header.astro",
    "src/components/layout/Footer.astro",
  ]) {
    assert.match(
      readFileSync(path, "utf8"),
      /BrandLockup/,
      `${path} must render BrandLockup`,
    );
  }
});
