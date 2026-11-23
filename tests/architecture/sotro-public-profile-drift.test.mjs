/**
 * Sổ Trọ public-profile drift guard.
 *
 * Sổ Trọ owns the canonical public profile (`docs/product/public-profile.json`, schema
 * `sotro-public-profile/1`). This site vendors a byte snapshot pinned to an exact Sotro revision
 * (`src/data/upstream/`) and its `sotro.yaml` record must mirror it. Any public claim changed
 * here without changing the upstream first fails this test: change the upstream, then re-vendor.
 *
 * Also mirrored: native `appAccess.android|ios` state/store link (Owner 2026-09-30: native apps
 * follow the web core and sync with it; in development until a build ships) and the flagship
 * listing (`public`, `featuredTier`, `displayOrder`). Deliberately not asserted: the record's
 * localized zh copy.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

const UPSTREAM_DIR = "src/data/upstream";
const SNAPSHOT = join(UPSTREAM_DIR, "sotro.public-profile.json");
const README = join(UPSTREAM_DIR, "README.md");
const RECORD = "src/content/products/sotro.yaml";
const PRODUCTS_DIR = "src/content/products";

const unquote = (value) =>
  value
    .trim()
    .replace(/^"((?:[^"\\]|\\.)*)"$/, (_, inner) => JSON.parse(`"${inner}"`))
    .replace(/^'(.*)'$/, "$1");

/** Text without full-line YAML comments (comments may legitimately mention pricing/emails). */
function stripComments(text) {
  return text
    .split("\n")
    .filter((line) => !/^\s*#/.test(line))
    .join("\n");
}

/** Top-level `key: scalar`. */
function scalar(text, key) {
  const m = new RegExp(`^${key}:[ \\t]*(.+?)[ \\t]*$`, "m").exec(text);
  return m ? unquote(m[1]) : null;
}

/** Items of `- x` directly under a key at the given indent (0 = top level). */
function list(text, key, indent = 0) {
  const pad = " ".repeat(indent);
  const m = new RegExp(
    `^${pad}${key}:[ \\t]*\\n((?:${pad}[ \\t]*- .*\\n?)+)`,
    "m",
  ).exec(text);
  if (!m) return [];
  return [...m[1].matchAll(/^\s*- (.+?)\s*$/gm)].map((x) => unquote(x[1]));
}

/** Returns the lines of the indented block belonging to `key:` (any nesting). */
function block(text, key, indent) {
  const pad = " ".repeat(indent);
  const m = new RegExp(
    `^${pad}${key}:[ \\t]*\\n((?:${pad} +.*\\n?|\\n)+)`,
    "m",
  ).exec(text)?.[1];
  return m ?? "";
}

/** `{ state, storeUrl }` of a native app under appAccess, or null when absent. */
function nativeApp(access, os) {
  const body = block(access, os, 2);
  if (!body) return null;
  const app = { state: /^ {4}state:[ \t]*(\S+)/m.exec(body)?.[1] ?? null };
  const store = /^ {4}storeUrl:[ \t]*(\S+)/m.exec(body)?.[1];
  if (store) app.storeUrl = store;
  return app;
}

export function readRecord(text) {
  const vi = block(text, "vi", 2);
  const access = block(text, "appAccess", 0);
  return {
    lifecycle: scalar(text, "lifecycle"),
    availability: scalar(text, "availability"),
    publicLabel: scalar(text, "publicLabel"),
    jobs: list(text, "jobs"),
    capabilities: list(text, "capabilities"),
    viJobs: list(vi, "jobs", 4),
    viCapabilities: list(vi, "capabilities", 4),
    signInUrl: /^ {2}signInUrl:[ \t]*(\S+)/m.exec(access)?.[1] ?? null,
    android: nativeApp(access, "android"),
    ios: nativeApp(access, "ios"),
    public: scalar(text, "public"),
    featuredTier: scalar(text, "featuredTier"),
    displayOrder: scalar(text, "displayOrder"),
    sourceRevision: scalar(text, "sourceRevision"),
  };
}

const PRICE_TEXT =
  /₫|\bVND\b|\bUSD\b|\$\s?\d|\d\s?(?:đ|đồng)\b|\b(?:price|prices|pricing|subscription|free trial|per month)\b|\/\s?(?:month|tháng)|(?:^|\s)gói (?:cước|trả phí)|定价|价格|收费|订阅/i;
/** An amount of money; the profile's own `paid` note may say "prices" but never a figure. */
const PRICE_AMOUNT = /₫|\bVND\b|\bUSD\b|\$\s?\d|\d\s?(?:đ|đồng)(?![\p{L}])/iu;
const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+/;

export function recordedRevision(readme) {
  return /Upstream revision\s*\|\s*`([0-9a-f]{40})`/.exec(readme)?.[1] ?? null;
}

/** Every drift between a sotro.yaml text and the vendored profile; empty when in sync. */
export function driftViolations(recordText, profile, readme) {
  const out = [];
  const rec = readRecord(recordText);
  const body = stripComments(recordText);
  const eq = (label, actual, expected) => {
    if (JSON.stringify(actual) !== JSON.stringify(expected))
      out.push(
        `${label}: site ${JSON.stringify(actual)} != profile ${JSON.stringify(expected)}`,
      );
  };
  eq("lifecycle", rec.lifecycle, profile.lifecycle);
  eq("availability", rec.availability, profile.availability);
  eq("publicLabel", rec.publicLabel, profile.publicLabel);
  eq("jobs (en)", rec.jobs, profile.jobs);
  eq("jobs (vi)", rec.viJobs, profile.i18n.vi.jobs);
  eq(
    "capabilities (en)",
    rec.capabilities,
    profile.capabilities.map((c) => c.text),
  );
  eq("capabilities (vi)", rec.viCapabilities, profile.i18n.vi.capabilities);
  eq("appAccess.signInUrl", rec.signInUrl, profile.appAccess.signInUrl);
  for (const os of ["android", "ios"])
    eq(`appAccess.${os}`, rec[os], profile.appAccess[os] ?? null);
  eq("listing.public", rec.public, String(profile.listing.public));
  eq("listing.featuredTier", rec.featuredTier, profile.listing.featuredTier);
  eq(
    "listing.displayOrder",
    rec.displayOrder,
    String(profile.listing.displayOrder),
  );
  eq(
    "sourceRevision vs snapshot README",
    rec.sourceRevision,
    recordedRevision(readme),
  );
  if (profile.paid?.status === "closed" || profile.pricing === null) {
    if (/^\s*(?:pricing|price|plans?|paid):/m.test(body))
      out.push("pricing key present while the profile has no pricing");
    const hit = PRICE_TEXT.exec(body);
    if (hit)
      out.push(
        `price/pricing text present ("${hit[0]}") while the profile has no pricing`,
      );
  }
  if (profile.supportEmail === null) {
    if (/^\s*supportEmail:/m.test(body)) out.push("supportEmail key present");
    const hit = EMAIL.exec(body);
    if (hit)
      out.push(
        `email present ("${hit[0]}") while profile supportEmail is null`,
      );
  }
  return out;
}

const profile = JSON.parse(readFileSync(SNAPSHOT, "utf8"));
const readme = readFileSync(README, "utf8");
const record = readFileSync(RECORD, "utf8");

test("the vendored snapshot is a Sổ Trọ public profile v1 with an exact 40-hex pin", () => {
  assert.equal(profile.schema, "sotro-public-profile/1");
  assert.equal(profile.slug, "sotro");
  assert.match(recordedRevision(readme) ?? "", /^[0-9a-f]{40}$/);
  assert.match(
    readme,
    /Change the upstream first, then re-vendor|change the upstream first/i,
  );
});

test("the snapshot is not loadable as a product record", () => {
  assert.ok(existsSync(SNAPSHOT));
  const stack = [PRODUCTS_DIR];
  const stray = [];
  while (stack.length) {
    const dir = stack.pop();
    for (const entry of readdirSync(dir)) {
      const path = join(dir, entry);
      if (statSync(path).isDirectory()) stack.push(path);
      else if (/public-profile\.json$/.test(entry)) stray.push(path);
    }
  }
  assert.deepEqual(
    stray,
    [],
    "content loader and provenance guard scan *.json here",
  );
});

test("sotro.yaml mirrors the upstream public profile", () => {
  assert.deepEqual(driftViolations(record, profile, readme), []);
});

test("paid is open, yet no pricing and no support email are in force", () => {
  // Owner 2026-11-23: the product is open and sells on its own site. This site
  // links there and never repeats a price, so `pricing` stays null and the
  // price-text guard in driftViolations() stays armed whatever paid.status is.
  assert.equal(profile.paid.status, "open");
  assert.equal(profile.pricing, null);
  assert.equal(profile.supportEmail, null);
  assert.doesNotMatch(JSON.stringify(profile.paid), PRICE_AMOUNT);
});

test("negative proof: the price guard holds for every paid status while pricing is null", () => {
  const priced = `${record}pricing:\n  monthly: 99000 VND\n`;
  for (const status of ["open", "closed"]) {
    const variant = { ...profile, paid: { ...profile.paid, status } };
    assert.ok(
      driftViolations(priced, variant, readme).some((v) => /pricing/.test(v)),
      `paid ${status}: a pricing key must be rejected`,
    );
  }
  assert.match('{"reason":"from 99.000 đ a month"}', PRICE_AMOUNT);
});

test("negative proof: changing any mirrored claim is detected", () => {
  const mutations = {
    availability: record.replace(
      "availability: public",
      "availability: preview",
    ),
    lifecycle: record.replace("lifecycle: active", "lifecycle: beta"),
    publicLabel: record.replace(
      "publicLabel: Available",
      "publicLabel: Preview",
    ),
    // Anchored to the jobs list item: shortDescription repeats this phrase,
    // and a bare replace() would mutate that field instead.
    "jobs (en)": record.replace(
      /^(\s+- See at a glance who still owes rent this month and what needs doing) today$/m,
      "$1",
    ),
    "jobs (vi)": record.replace("hôm nay cần làm gì", "hôm nay"),
    "capabilities (en)": record.replace(
      "a receipt to copy into Zalo",
      "a receipt we send to Zalo for you",
    ),
    "capabilities (vi)": record.replace(
      "biên nhận sao chép gửi qua Zalo",
      "biên nhận tự động gửi qua Zalo",
    ),
    "appAccess.signInUrl": record.replace(
      "yenlume.blueskyzlabs.com/login",
      "yenlume.blueskyzlabs.com/signup",
    ),
    "appAccess.android": record.replace(
      "  android:\n    state: in-development\n",
      "  android:\n    state: available\n    storeUrl: https://play.google.com/store/apps/x\n",
    ),
    "appAccess.ios": record.replace("  ios:\n    state: in-development\n", ""),
    "listing.public": record.replace(/^public: true$/m, "public: false"),
    "listing.featuredTier": record.replace(
      /^featuredTier: hero$/m,
      "featuredTier: standard",
    ),
    "listing.displayOrder": record.replace(
      /^displayOrder: 1$/m,
      "displayOrder: 2",
    ),
    sourceRevision: record.replace(
      /^sourceRevision: .*$/m,
      `sourceRevision: ${"0".repeat(40)}`,
    ),
  };
  for (const [name, mutated] of Object.entries(mutations)) {
    assert.notEqual(
      mutated,
      record,
      `${name}: mutation must change the record`,
    );
    const found = driftViolations(mutated, profile, readme);
    assert.ok(
      found.some((v) => v.startsWith(name)),
      `${name}: expected a drift violation, got ${JSON.stringify(found)}`,
    );
  }
});

test("negative proof: price text, a pricing key or a support email is rejected", () => {
  const priced = `${record}pricing:\n  monthly: 99000 VND\n`;
  assert.ok(
    driftViolations(priced, profile, readme).some((v) => /pricing/.test(v)),
  );
  const withText = record.replace(
    "  - web\n",
    "  - web\n# comment about pricing is ignored\n",
  );
  assert.deepEqual(driftViolations(withText, profile, readme), []);
  const pricedCapability = record.replace(
    "a receipt to copy into Zalo",
    "from 99,000 VND per month",
  );
  assert.ok(
    driftViolations(pricedCapability, profile, readme).some((v) =>
      /price/.test(v),
    ),
  );
  const mailed = `${record}supportEmail: help@blueskyzlabs.com\n`;
  assert.ok(
    driftViolations(mailed, profile, readme).some((v) => /email/i.test(v)),
  );
});
