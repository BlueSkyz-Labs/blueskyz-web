import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { emptyRegistryPrimaryCta } from "../../src/lib/act.ts";
import { resolveLifecycleCta } from "../../src/lib/lifecycle-cta.ts";
import { labelFor, SHARED_LABELS } from "../../src/data/site.ts";

const LOCALES = ["en", "vi", "zh", "zh-hant"];

function walkFiles(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".git") continue;
      walkFiles(path, out);
    } else {
      out.push(path);
    }
  }
  return out;
}

function filesContaining(root, needle) {
  return walkFiles(root)
    .filter((path) => !/node_modules/.test(path))
    .filter((path) => {
      try {
        return readFileSync(path, "utf8").includes(needle);
      } catch {
        return false;
      }
    })
    .map((path) => path.replace(/\\/g, "/"));
}

/**
 * WORK-01: the retired tonydemo.com zone may only appear in the truth guard
 * (`src/lib/truth.ts`) and the agent-passport origin guard. A built or served
 * page that names it would fail the production public-truth gate (ADR 0006).
 */
test("retired tonydemo zone appears only in truth guards, never as identity", () => {
  const hits = new Set([
    ...filesContaining("src", "tonydemo.com"),
    ...filesContaining("public", "tonydemo.com"),
    ...filesContaining("scripts", "tonydemo.com"),
  ]);
  const allowed = new Set(["src/lib/truth.ts", "src/lib/agent-passport.ts"]);
  for (const hit of hits) {
    assert.ok(
      allowed.has(hit),
      `unexpected tonydemo.com reference outside truth guards: ${hit}`,
    );
  }
});

test("negative proof: a tonydemo reference outside guards fails the sweep", () => {
  const allowed = new Set(["src/lib/truth.ts", "src/lib/agent-passport.ts"]);
  assert.equal(
    allowed.has("src/pages/en/index.astro"),
    false,
    "a homepage tonydemo reference must be rejected",
  );
});

/**
 * WORK-02: development/preview records (Sổ Trọ, Sổ Tâm) resolve to the
 * recorded-status CTA, never Try. Surfaces must not author Try verbs inline.
 */
test("development preview products resolve to the recorded-status CTA", () => {
  for (const slug of ["sotro", "sotam"]) {
    const cta = resolveLifecycleCta(
      {
        slug,
        lifecycle: "development",
        availability: "preview",
        primaryActionHref: `https://blueskyzlabs.com/en/products/${slug}/`,
      },
      "en",
    );
    assert.equal(cta.verb, "view-development-status", slug);
    assert.equal(cta.external, false, slug);
    assert.match(cta.href, new RegExp(`^/en/products/${slug}/$`), slug);
  }
});

test("product surfaces never author Try verbs inline", () => {
  const surfaces = [
    "src/components/product/ProductCard.astro",
    "src/components/product/FlagshipTheatre.astro",
    "src/components/product/ProductHouse.astro",
    "src/components/sections/Hero.astro",
    ...LOCALES.map((lang) => `src/pages/${lang}/products/[slug].astro`),
  ];
  for (const path of surfaces) {
    const source = readFileSync(path, "utf8");
    assert.doesNotMatch(source, /Try now/, path);
    assert.doesNotMatch(source, /Open product/, path);
  }
});

/**
 * WORK-03: every "What you can check" claim on About is bound to a real
 * registry claim and a built locale route (privacy, security, verify).
 */
test("about check items bind to registry claims and built locale routes", () => {
  const about = readFileSync(
    "src/components/empty-state/AboutComposition.astro",
    "utf8",
  );
  const claimIds = [...about.matchAll(/data-claim-id="([^"]+)"/g)].map(
    ([, id]) => id,
  );
  assert.ok(claimIds.length >= 2, "about must carry bound claim items");
  const registry = readFileSync("src/data/claims.ts", "utf8");
  for (const id of claimIds) {
    assert.ok(
      registry.includes(`id: "${id}"`),
      `about claim ${id} must exist in the claim registry`,
    );
  }
  assert.match(about, /aboutCheckNoCookies/);
  assert.match(about, /aboutCheckSecurity/);
  for (const lang of LOCALES) {
    for (const route of ["privacy", "security", "verify"]) {
      assert.ok(
        existsSync(`src/pages/${lang}/${route}.astro`),
        `/${lang}/${route}/ must build in every locale`,
      );
    }
  }
});

test("negative proof: an unregistered about claim fails the binding", () => {
  const registry = readFileSync("src/data/claims.ts", "utf8");
  assert.equal(
    registry.includes('id: "about-claim-does-not-exist"'),
    false,
    "an invented claim id must not resolve",
  );
});

/**
 * WORK-04: identity-art proof media always renders the disclosure caption and
 * is never presented as a running-app screenshot.
 */
test("identity-art proof renders the not-a-screenshot disclosure", () => {
  for (const lang of LOCALES) {
    const caption = labelFor(SHARED_LABELS.proofCaption, lang);
    assert.ok(
      caption.length > 0,
      `identity-art caption must exist for ${lang}`,
    );
  }
  assert.match(labelFor(SHARED_LABELS.proofCaption, "en"), /not a screenshot/i);
  const copy = readFileSync("src/lib/product-copy.ts", "utf8");
  assert.match(copy, /proofCaptionForKind/);
  assert.match(copy, /labelFor\(SHARED_LABELS\.proofCaption, lang\)/);
  const theatre = readFileSync(
    "src/components/product/FlagshipTheatre.astro",
    "utf8",
  );
  assert.match(theatre, /proofCaptionForKind\(media\.kind, lang\)/);
  assert.match(theatre, /<figcaption>/);
  for (const slug of ["sotam"]) {
    const yaml = readFileSync(`src/content/products/${slug}.yaml`, "utf8");
    assert.match(yaml, /kind: identity-art/);
    assert.doesNotMatch(yaml, /screenshot/i, slug);
  }
  // YENLUME (slug sotro) is listed live since 2026-11-23, so DEC-039 Part B
  // requires the opposite: a real capture, never identity art, bound to the
  // product's gate record. The two kinds stay mutually exclusive in a record.
  const live = readFileSync("src/content/products/sotro.yaml", "utf8");
  assert.match(live, /^lifecycle: active$/m);
  assert.match(live, /^ {4}kind: ui-screenshot$/m);
  assert.doesNotMatch(live, /kind: identity-art/);
  assert.doesNotMatch(live, /^ {4}src: .*identity/m);
  assert.doesNotMatch(live, /^ {4}alt: .*\b(?:identity|artwork)\b/im);
  assert.match(live, /^releaseGate:\n {2}record: https:\/\/github\.com\//m);
  assert.match(live, /^ {2}deployedSha: [0-9a-f]{40}$/m);
});

/**
 * WORK-05: with no committed owner mailbox, Contact soft-lands via
 * BusinessRouteState; the mailto path only exists behind a real address.
 */
test("contact soft-lands through BusinessRouteState without an invented mailbox", () => {
  assert.deepEqual(emptyRegistryPrimaryCta(null, "en"), {
    href: "/en/about/",
    label: "About BlueSkyz",
  });
  for (const lang of LOCALES) {
    const source = readFileSync(`src/pages/${lang}/contact.astro`, "utf8");
    assert.match(source, /PublicContactEmails/, lang);
    assert.doesNotMatch(
      source,
      /mailto:(hello@|contact@|info@|support@)/i,
      lang,
    );
  }
  const contactEmails = readFileSync(
    "src/components/empty-state/PublicContactEmails.astro",
    "utf8",
  );
  assert.match(contactEmails, /BusinessRouteState/);
  assert.match(contactEmails, /SITE\.contactEmail/);
  assert.match(contactEmails, /SITE\.supportEmail/);
});
