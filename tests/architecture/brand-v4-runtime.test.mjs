import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

test("runtime publishes the v4 and v5 web asset projections", () => {
  for (const path of [
    "public/icons/favicon.svg",
    "public/icons/favicon.ico",
    "public/icons/apple-touch-icon.png",
    "public/icons/site.webmanifest",
    "public/icons/MASKABLE/android-maskable-192x192.png",
    "public/icons/MASKABLE/android-maskable-512x512.png",
    "public/icons/safari-pinned-tab.svg",
    "public/brand/blueskyz/v5/logos/lockup-compact-labs-paper.svg",
    "public/brand/blueskyz/v5/logos/lockup-compact-labs-night.svg",
    "public/brand/blueskyz/v5/logos/lockup-labs-paper.svg",
    "public/brand/blueskyz/v5/logos/lockup-labs-night.svg",
    "public/brand/blueskyz/v4/principles/intelligence.svg",
    "public/brand/blueskyz/v4/products/apexagent.svg",
    "public/brand/blueskyz/v4/hero/website_hero_1920x1080.png",
    "public/brand/blueskyz/v4/hero/website_hero_1920x1080.webp",
    "public/brand/blueskyz/v4/hero/website_hero_1920x1080.avif",
    "public/social/og-default.png",
  ]) {
    assert.equal(existsSync(path), true, path);
  }
});

test("document head points at the kit favicon, PWA and social assets", () => {
  const layout = readFileSync("src/layouts/BaseLayout.astro", "utf8");
  const seo = readFileSync("src/lib/seo.ts", "utf8");
  assert.match(layout, /\/icons\/favicon\.svg/);
  assert.match(layout, /\/icons\/favicon\.ico/);
  assert.match(layout, /\/icons\/apple-touch-icon\.png/);
  assert.match(layout, /\/icons\/site\.webmanifest/);
  assert.match(layout, /\/icons\/safari-pinned-tab\.svg/);
  assert.match(seo, /\/social\/og-default\.png/);
});
