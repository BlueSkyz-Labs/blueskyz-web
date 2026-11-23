/**
 * Owner 2026-10-24 (O-03): `appAccess.publicSignup` (default false) gates the
 * only way into the live app from a product page. Decision #575 (no public
 * sign-in link) holds while it is false.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { appOpenAction } from "../../src/lib/app-open-action.ts";
import { lifecycleCtaVerbLabel } from "../../src/lib/lifecycle-cta.ts";
import { productSchema } from "../../src/lib/product-schema.ts";

const SIGN_IN = "https://yenlume.blueskyzlabs.com/login";
const LANGS = ["en", "vi", "zh", "zh-hant"];

test("publicSignup false or absent: no action (decision #575 holds)", () => {
  for (const lang of LANGS) {
    assert.equal(
      appOpenAction("sotro", { signInUrl: SIGN_IN, publicSignup: false }, lang),
      null,
    );
    assert.equal(appOpenAction("sotro", { signInUrl: SIGN_IN }, lang), null);
    assert.equal(appOpenAction("sotro", undefined, lang), null);
  }
});

test("publicSignup true: the action points at the origin, with the existing label", () => {
  for (const lang of LANGS) {
    const action = appOpenAction(
      "sotro",
      { signInUrl: SIGN_IN, publicSignup: true },
      lang,
    );
    assert.deepEqual(action, {
      href: "https://yenlume.blueskyzlabs.com/",
      label: lifecycleCtaVerbLabel("try", lang),
    });
  }
});

test("publicSignup true but no or foreign sign-in URL: fail closed", () => {
  assert.equal(appOpenAction("sotro", { publicSignup: true }, "en"), null);
  assert.equal(
    appOpenAction(
      "sotro",
      {
        publicSignup: true,
        signInUrl: "https://yenlume.blueskyzlabs.com.evil.test/login",
      },
      "en",
    ),
    null,
  );
  assert.equal(
    appOpenAction("sotam", { publicSignup: true, signInUrl: SIGN_IN }, "en"),
    null,
  );
  // The retired slug host is no longer this product's app origin.
  assert.equal(
    appOpenAction(
      "sotro",
      { publicSignup: true, signInUrl: "https://sotro.blueskyzlabs.com/login" },
      "en",
    ),
    null,
  );
});

test("the schema defaults publicSignup to false; Sổ Trọ opted in for the public launch (Owner 2026-11-22)", () => {
  const record = readFileSync("src/content/products/sotro.yaml", "utf8");
  assert.match(record, /^ {2}publicSignup: true$/m);
  assert.match(
    record,
    /signInUrl: https:\/\/yenlume\.blueskyzlabs\.com\/login/,
  );
  const parsed = productSchema.safeParse({
    slug: "sotro",
    name: "Fixture",
    shortDescription: "Synthetic.",
    lifecycle: "development",
    availability: "preview",
    publicLabel: "In development",
    audience: ["individual"],
    jobs: ["Review a synthetic record"],
    capabilities: ["Synthetic scope A", "Synthetic scope B"],
    platforms: ["web"],
    primaryAction: {
      type: "preview",
      label: "Preview",
      href: "https://blueskyzlabs.com/en/products/sotro/",
    },
    proof: { publicUrl: "https://blueskyzlabs.com/en/products/sotro/" },
    appAccess: { signInUrl: SIGN_IN },
    endorsement: "A BlueSkyz Labs product",
    featuredTier: "hero",
    displayOrder: 1,
    public: true,
    sourceRevision: "abcdef1",
    lastReviewedAt: "2026-09-27",
  });
  assert.equal(parsed.success, true);
  assert.equal(parsed.data.appAccess.publicSignup, false);
});

test("every locale page wires the helper into the primary action", () => {
  for (const lang of LANGS) {
    const page = readFileSync(
      `src/pages/${lang}/products/[slug].astro`,
      "utf8",
    );
    assert.match(
      page,
      /appOpenAction\(data\.slug, data\.appAccess, lang\)/,
      lang,
    );
    assert.match(page, /href=\{openApp\.href\}/, lang);
  }
});

test("negative proof: a flag that ignores publicSignup would be caught", () => {
  // The gate is the first statement of the helper; flipping it must change
  // the outcome for a record that did not opt in.
  const optedOut = appOpenAction(
    "sotro",
    { signInUrl: SIGN_IN, publicSignup: false },
    "en",
  );
  const optedIn = appOpenAction(
    "sotro",
    { signInUrl: SIGN_IN, publicSignup: true },
    "en",
  );
  assert.notDeepEqual(optedOut, optedIn);
});
