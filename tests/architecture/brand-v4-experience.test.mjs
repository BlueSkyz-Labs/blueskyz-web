import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("hero keeps the horizon field and the header carries the v5 lockup", () => {
  const hero = readFileSync("src/components/sections/Hero.astro", "utf8");
  const lockup = readFileSync("src/components/brand/BrandLockup.astro", "utf8");
  const site = readFileSync("src/data/site.ts", "utf8");
  // C2 (approved design §9 W1 + plan Task 5) transforms the hero from a framed
  // brand-art card into an integrated Horizon field, so the brand raster is no
  // longer required IN the hero. Brand fidelity still means the kit lockup (v5 since 2026-11-10), the
  // ink plane and the tagline contract — and the removed framed card must not
  // come back.
  // Experience v6 S1: the header already carries the lockup, so the hero must
  // not repeat it (audit E-05). The lockup contract is still asserted below on
  // the BrandLockup component itself.
  assert.doesNotMatch(hero, /BrandLockup/);
  assert.match(hero, /HorizonField/);
  assert.match(hero, /hero-plane--ink/);
  assert.doesNotMatch(hero, /hero-art-frame|brandAssets\.hero/);
  assert.match(site, /taglineLead: "Intelligence\. Elevated\."/);
  assert.match(site, /taglineAccent: "Impact\."/);
  assert.match(
    lockup,
    /\/brand\/blueskyz\/v5\/logos\/lockup-compact-labs-paper\.svg/,
  );
  assert.match(
    lockup,
    /\/brand\/blueskyz\/v5\/logos\/lockup-compact-labs-night\.svg/,
  );
});

test("v4 principle icons remain available in the brand asset registry", () => {
  // W10 deleted the unused OneHouse / OneHouseMatrix surfaces; the official
  // principle icons stay registered for the surfaces that consume them.
  const assets = readFileSync("src/data/brand-assets.ts", "utf8");
  for (const name of ["intelligence", "elevation", "trust", "impact"]) {
    assert.match(assets, new RegExp(name + ":"));
  }
});

test("v4 copy library description is the public brand proposition", () => {
  const site = readFileSync("src/data/site.ts", "utf8");
  assert.match(
    site,
    /We build intelligent products that empower people and elevate the way work gets done\./,
  );
  assert.match(site, /A higher perspective builds a brighter tomorrow\./);
});

test("footer tagline keeps a space between lead and accent (F-02)", () => {
  const footer = readFileSync("src/components/layout/Footer.astro", "utf8");
  // F-02 (2026-10-07): a whitespace-only literal between the tagline segments
  // is dropped at compile time, rendering "Nâng tầm.Tác động." on production.
  // The separating space must live inside a dynamic expression.
  assert.doesNotMatch(footer, /\{taglineLead\}\{" "\}/);
  assert.match(footer, /\$\{taglineLead\} `\}/);
});
