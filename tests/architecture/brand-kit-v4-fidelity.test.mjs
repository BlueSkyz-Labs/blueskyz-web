/**
 * Brand Kit v4 fidelity guard.
 * Every published v4 brand asset (hero art, principle icons, product marks,
 * tokens) must stay byte-identical to its master in the committed kit mirror
 * (brand/blueskyz-production-v4). The masterbrand lockup, the web icon set
 * and the social card moved to Brand Kit v5 on 2026-11-10 and are guarded by
 * brand-kit-v5-fidelity.test.mjs. The CSS token layer
 * must carry the kit's values, and the document head must keep the
 * favicon/theme contract. Drift in any of these fails the build.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";

const KIT = "brand/blueskyz-production-v4";

const PAIRS = [
  [
    `${KIT}/04_DIGITAL/01_WEBSITE/website_hero_1920x1080.png`,
    "public/brand/blueskyz/v4/hero/website_hero_1920x1080.png",
  ],
  [
    `${KIT}/04_DIGITAL/10_WEB_OPTIMIZED/website_hero_1920x1080.webp`,
    "public/brand/blueskyz/v4/hero/website_hero_1920x1080.webp",
  ],
  [
    `${KIT}/04_DIGITAL/10_WEB_OPTIMIZED/website_hero_1920x1080.avif`,
    "public/brand/blueskyz/v4/hero/website_hero_1920x1080.avif",
  ],
  ...[
    ["intelligence", "intelligence"],
    ["elevation", "elevation"],
    ["trust", "trust"],
    ["impact", "impact"],
  ].map(([icon, principle]) => [
    `${KIT}/03_ICONS/02_BRAND_PRINCIPLES/${icon}.svg`,
    `public/brand/blueskyz/v4/principles/${principle}.svg`,
  ]),
  // Sổ Trọ is a recorded Owner DEVIATION (red-book app icon, 2026-10-01):
  // its product assets are guarded by sotro-redbook-icon.test.mjs instead.
  ...["apexagent", "fluentarc", "sotam", "vungtaylai"].flatMap((product) => [
    [
      `${KIT}/03_ICONS/03_PRODUCT_ICONS/${product}.svg`,
      `public/brand/blueskyz/v4/products/${product}.svg`,
    ],
    [
      `${KIT}/06_PRODUCT_BRANDS/01_LOCKUPS_SVG/${product}_endorsed_lockup_dark.svg`,
      `public/brand/blueskyz/v4/products/${product}_endorsed_lockup_dark.svg`,
    ],
    [
      `${KIT}/06_PRODUCT_BRANDS/01_LOCKUPS_SVG/${product}_endorsed_lockup_light.svg`,
      `public/brand/blueskyz/v4/products/${product}_endorsed_lockup_light.svg`,
    ],
  ]),
  ...[`tokens.css`, `tokens.json`, `tokens.dtcg.json`].map((file) => [
    `${KIT}/07_DESIGN_TOKENS/${file}`,
    `public/brand/blueskyz/v4/tokens/${file}`,
  ]),
];

test("every published v4 asset is byte-identical to the kit master", () => {
  const drifted = [];
  for (const [kitPath, publicPath] of PAIRS) {
    assert.ok(existsSync(kitPath), `kit master missing: ${kitPath}`);
    assert.ok(existsSync(publicPath), `published asset missing: ${publicPath}`);
    const kitBytes = readFileSync(kitPath);
    const publicBytes = readFileSync(publicPath);
    if (!kitBytes.equals(publicBytes)) {
      drifted.push(publicPath);
    }
  }
  assert.deepEqual(
    drifted,
    [],
    `assets drifted from the kit master: ${drifted}`,
  );
});

test("the CSS token layer carries the kit's brand values", () => {
  const css = readFileSync("src/styles/global.css", "utf8").toLowerCase();
  const tokens = JSON.parse(
    readFileSync(`${KIT}/07_DESIGN_TOKENS/tokens.json`, "utf8"),
  );
  // Pure black/white are normative primitives, not UI colors.
  const PRIMITIVES = new Set(["#000000", "#ffffff"]);
  for (const value of Object.values(tokens.color.brand)) {
    if (PRIMITIVES.has(String(value).toLowerCase())) continue;
    assert.ok(
      css.includes(String(value).toLowerCase()),
      `global.css must carry kit brand color ${value}`,
    );
  }
  for (const value of Object.values(tokens.color.semantic)) {
    assert.ok(
      css.includes(String(value).toLowerCase()),
      `global.css must carry kit semantic color ${value}`,
    );
  }
  for (const value of [
    tokens.motion.fast,
    tokens.motion.normal,
    tokens.motion.slow,
  ]) {
    assert.ok(
      css.includes(String(value).toLowerCase()),
      `global.css must carry kit motion value ${value}`,
    );
  }
  assert.ok(css.includes("--brand-gradient-hero"), "hero gradient token");
  assert.ok(css.includes('data-theme="dark"'), "dormant dark semantics block");
});

test("the document head keeps the kit favicon and theme contract", () => {
  const layout = readFileSync("src/layouts/BaseLayout.astro", "utf8");
  assert.match(layout, /href="\/icons\/favicon\.svg" type="image\/svg\+xml"/);
  assert.match(layout, /href="\/icons\/favicon\.ico" sizes="any"/);
  assert.match(layout, /href="\/icons\/apple-touch-icon\.png"/);
  assert.match(layout, /href="\/icons\/site\.webmanifest"/);
  assert.match(layout, /name="theme-color" content="#0B1020"/);
});

test("the committed kit mirror reports production v4.0.0", () => {
  const version = readFileSync(`${KIT}/00_START_HERE/VERSION.txt`, "utf8");
  assert.match(version, /4\.0\.0/);
});

test("every brandAssets registry path resolves under public/", () => {
  const registry = readFileSync("src/data/brand-assets.ts", "utf8");
  const paths = [...registry.matchAll(/"\/brand\/[^"]+"/g)].map((match) =>
    match[0].slice(1, -1),
  );
  assert.ok(paths.length >= 20, "registry must declare the published assets");
  const missing = paths.filter((path) => !existsSync(`public${path}`));
  assert.deepEqual(missing, [], `registry paths missing on disk: ${missing}`);
});

test("the kit motion easing is carried as a parity alias", () => {
  const css = readFileSync("src/styles/global.css", "utf8").toLowerCase();
  assert.ok(
    css.includes("cubic-bezier(0.2, 0, 0, 1)"),
    "global.css must carry the kit ease-standard curve",
  );
});

test("public review dates render as semantic <time datetime>", () => {
  const details = readFileSync(
    "src/components/integrity/EvidenceDetails.astro",
    "utf8",
  );
  const passport = readFileSync(
    "src/components/integrity/EvidencePassport.astro",
    "utf8",
  );
  // Wave G2: the semantic <time datetime> lives once in the shared Dateline.
  const dateline = readFileSync("src/components/shared/Dateline.astro", "utf8");
  assert.match(dateline, /<time datetime=\{iso\}/);
  assert.match(details, /<Dateline[^>]*iso=\{review\.reviewedOn\}/);
  assert.match(passport, /<Dateline[^>]*iso=\{passport\.reviewedOn\}/);
});
