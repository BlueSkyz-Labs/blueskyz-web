/**
 * Brand Kit v5 fidelity guard (Owner approved the kit 2026-11-10).
 * The masterbrand lockup, the web icon set, the social card and the display
 * face are published from the committed kit subset
 * (brand/blueskyz-brand-kit-v5). Every published file must stay byte-identical
 * to its kit master, and the display face must be reproducible from the kit's
 * type masters. Product marks, hero art and tokens stay on Production v4
 * (brand-kit-v4-fidelity.test.mjs).
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

const KIT = "brand/blueskyz-brand-kit-v5";
const ICONS = `${KIT}/13_Web_Icons`;

function walk(dir, base = dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walk(path, base, out);
    else out.push(path.slice(base.length + 1).replaceAll("\\", "/"));
  }
  return out.sort();
}

const ICON_FILES = walk(ICONS);

const PAIRS = [
  ...ICON_FILES.map((file) => [`${ICONS}/${file}`, `public/icons/${file}`]),
  ...[
    "favicon.ico",
    "apple-touch-icon.png",
    "safari-pinned-tab.svg",
    "site.webmanifest",
    "browserconfig.xml",
  ].map((file) => [`${ICONS}/${file}`, `public/${file}`]),
  ...[
    "lockup-labs-paper.svg",
    "lockup-labs-night.svg",
    "lockup-compact-labs-paper.svg",
    "lockup-compact-labs-night.svg",
  ].map((file) => [
    `${KIT}/01_Logo/${file}`,
    `public/brand/blueskyz/v5/logos/${file}`,
  ]),
  ...["png", "webp", "avif"].map((ext) => [
    `${KIT}/07_Social/link-preview-1200x630.${ext}`,
    `public/social/og-default.${ext}`,
  ]),
];

/** Published paths whose bytes differ from (or lack) their kit master. */
export function drifted(pairs, read = readFileSync, exists = existsSync) {
  const out = [];
  for (const [kitPath, publicPath] of pairs) {
    if (!exists(kitPath) || !exists(publicPath)) {
      out.push(publicPath);
      continue;
    }
    if (!read(kitPath).equals(read(publicPath))) out.push(publicPath);
  }
  return out;
}

/** The three sail facets, in order, as they appear in a kit SVG. */
export function sailFacets(svg) {
  return [...svg.matchAll(/\bd="(M72 432|M394 54)[^"]*"/g)].map((m) =>
    m[0].replace(/\s+/g, ""),
  );
}

test("the web icon set is complete", () => {
  for (const file of [
    "favicon.ico",
    "favicon.svg",
    "apple-touch-icon.png",
    "android-chrome-192x192.png",
    "android-chrome-512x512.png",
    "MASKABLE/android-maskable-192x192.png",
    "MASKABLE/android-maskable-512x512.png",
    "APPLE/apple-touch-icon-180x180.png",
    "mstile-150x150.png",
    "safari-pinned-tab.svg",
    "site.webmanifest",
    "browserconfig.xml",
  ]) {
    assert.ok(ICON_FILES.includes(file), `kit web icon missing: ${file}`);
  }
  assert.ok(
    ICON_FILES.length >= 28,
    `expected 28 icons, got ${ICON_FILES.length}`,
  );
});

test("every published v5 asset is byte-identical to the kit master", () => {
  assert.deepEqual(drifted(PAIRS), []);
});

test("published icons carry nothing the kit does not", () => {
  assert.deepEqual(walk("public/icons"), ICON_FILES);
});

test("the committed kit subset reports 5.0.0 and keeps the type licence", () => {
  assert.match(readFileSync(`${KIT}/VERSION.txt`, "utf8"), /^5\.0\.0\s*$/);
  assert.match(
    readFileSync(`${KIT}/03_Type/OFL-NotoSerifDisplay.txt`, "utf8"),
    /SIL OPEN FONT LICENSE Version 1\.1/i,
  );
  for (const subset of ["latin", "vietnamese"]) {
    assert.ok(
      existsSync(
        `${KIT}/03_Type/noto-serif-display-${subset}-wght-normal.woff2`,
      ),
      `${subset} display master`,
    );
  }
});

test("every kit mark draws the same three-facet sail", () => {
  const master = sailFacets(
    readFileSync(`${KIT}/01_Logo/sail-night.svg`, "utf8"),
  );
  assert.equal(master.length, 3);
  for (const file of readdirSync(`${KIT}/01_Logo`)) {
    const facets = sailFacets(readFileSync(`${KIT}/01_Logo/${file}`, "utf8"));
    assert.deepEqual(facets.slice(0, 3), master, `${file} sail geometry`);
  }
});

test("kit vectors stay lean: no embedded metadata, scripts or remote refs", () => {
  const svgs = [
    ...readdirSync(`${KIT}/01_Logo`).map((f) => `${KIT}/01_Logo/${f}`),
    `${ICONS}/favicon.svg`,
    `${ICONS}/safari-pinned-tab.svg`,
  ];
  for (const path of svgs) {
    const svg = readFileSync(path, "utf8");
    assert.doesNotMatch(svg, /<metadata|<script|<foreignObject/i, path);
    assert.doesNotMatch(svg, /\b(href|src)\s*=\s*"(?!#)/i, path);
    assert.ok(statSync(path).size < 32_000, `${path} is over 32 KB`);
  }
});

test("the kit colour tokens name the house palette", () => {
  const css = readFileSync(`${KIT}/02_Colour/tokens.css`, "utf8").toLowerCase();
  for (const value of ["#05070b", "#0b1020", "#f7f8fa", "#2564ff", "#d9c08c"]) {
    assert.ok(css.includes(value), `tokens.css must carry ${value}`);
  }
  const site = readFileSync("src/styles/global.css", "utf8").toLowerCase();
  for (const value of ["#0b1020", "#f7f8fa", "#2564ff"]) {
    assert.ok(site.includes(value), `global.css must carry ${value}`);
  }
});

test("negative proof: drift, a missing file and a redrawn sail are reported", () => {
  const [kitPath, publicPath] = PAIRS[0];
  const bytes = readFileSync(kitPath);
  const tampered = Buffer.concat([bytes, Buffer.from([0])]);
  assert.deepEqual(
    drifted([[kitPath, publicPath]], (p) =>
      p === publicPath ? tampered : bytes,
    ),
    [publicPath],
  );
  assert.deepEqual(
    drifted([[kitPath, publicPath]], readFileSync, (p) => p !== publicPath),
    [publicPath],
  );
  const master = readFileSync(`${KIT}/01_Logo/sail-night.svg`, "utf8");
  assert.notDeepEqual(
    sailFacets(master.replace("M394 54C353 165", "M394 54C353 170")),
    sailFacets(master),
  );
});
