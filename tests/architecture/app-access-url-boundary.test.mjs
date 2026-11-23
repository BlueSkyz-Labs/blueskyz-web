/**
 * App-access destination authority regression.
 * Pure URL tests use synthetic URLs only; no network or live authentication.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { productSchema } from "../../src/lib/product-schema.ts";
import {
  isCanonicalAppSignInUrl,
  isOfficialMobileStoreUrl,
} from "../../src/lib/app-access-url.ts";

test("approved product sign-in shapes stay usable", () => {
  const approved = [
    ["sotro", "https://yenlume.blueskyzlabs.com/login"],
    ["sotam", "https://sotam.blueskyzlabs.com/auth/login"],
  ];
  for (const [slug, url] of approved) {
    assert.equal(isCanonicalAppSignInUrl(slug, url), true);
  }
});

test("sign-in rejects deceptive destinations and parameters", () => {
  const invalid = [
    "http://yenlume.blueskyzlabs.com/login",
    "https://sotam.blueskyzlabs.com/login",
    "https://yenlume.blueskyzlabs.com.attacker.invalid/login",
    "https://yenlume.blueskyzlabs.com@attacker.invalid/login",
    "https://visitor@yenlume.blueskyzlabs.com/login",
    "https://yenlume.blueskyzlabs.com:444/login",
    "https://yenlume.blueskyzlabs.com/",
    "https://yenlume.blueskyzlabs.com/login?redirect=attacker.invalid",
    "https://yenlume.blueskyzlabs.com/login#session",
    " https://yenlume.blueskyzlabs.com/login",
    "not a URL",
  ];
  for (const candidate of invalid) {
    assert.equal(isCanonicalAppSignInUrl("sotro", candidate), false, candidate);
  }
  // ADR 0006 exception: YENLUME (slug sotro) lives on its named host, so the
  // slug host is no longer a sign-in authority for it, and its host is not
  // one for any other product.
  for (const retired of [
    "https://sotro.blueskyzlabs.com/login",
    "https://yenlume.blueskyzlabs.com.attacker.invalid/login",
    "https://xyenlume.blueskyzlabs.com/login",
    "https://yenlume.blueskyzlabs.co/login",
  ]) {
    assert.equal(isCanonicalAppSignInUrl("sotro", retired), false, retired);
  }
  assert.equal(
    isCanonicalAppSignInUrl("sotam", "https://yenlume.blueskyzlabs.com/login"),
    false,
  );
  assert.equal(
    isCanonicalAppSignInUrl("yenlume", "https://sotro.blueskyzlabs.com/login"),
    false,
  );
  assert.equal(
    isCanonicalAppSignInUrl(
      "constructor",
      "https://yenlume.blueskyzlabs.com/login",
    ),
    false,
  );
  const badSlug = "sotro.attacker";
  const badUrl = "https://sotro.attacker.blueskyzlabs.com/login";
  assert.equal(isCanonicalAppSignInUrl(badSlug, badUrl), false);
});

test("store listings reject platform swapping and deceptive hosts", () => {
  const playUrl = "https://play.google.com/store/apps/details?id=x";
  const appleUrl = "https://apps.apple.com/vn/app/example/id123456789";
  assert.equal(isOfficialMobileStoreUrl("android", playUrl), true);
  assert.equal(isOfficialMobileStoreUrl("ios", appleUrl), true);
  assert.equal(
    isOfficialMobileStoreUrl("ios", "https://apps.apple.com/app/id123456789"),
    true,
  );
  const invalid = [
    ["android", "https://play.google.com.evil.test/store/apps/details?id=x"],
    ["android", "https://user@play.google.com/store/apps/details?id=x"],
    ["android", "https://play.google.com/store/apps/details"],
    ["android", "https://apps.apple.com/app/id12345"],
    ["android", "https://play.google.com/store/apps/details?id=x#fragment"],
    ["ios", "https://play.google.com/store/apps/details?id=x"],
    ["ios", "https://apps.apple.com.attacker.invalid/vn/app/x/id12345"],
    ["ios", "https://apps.apple.com/vn/app/x"],
    ["ios", "https://apps.apple.com/vn/app/x/idnot-a-number"],
    ["ios", "javascript:alert(1)"],
  ];
  for (const [platform, candidate] of invalid) {
    assert.equal(
      isOfficialMobileStoreUrl(platform, candidate),
      false,
      `${platform}: ${candidate}`,
    );
  }
});

test("the product schema invokes both destination authority checks", () => {
  const source = readFileSync("src/lib/product-schema.ts", "utf8");
  assert.match(source, /isCanonicalAppSignInUrl\(value\.slug, signInUrl\)/);
  assert.match(source, /isOfficialMobileStoreUrl\(platform, storeUrl\)/);
  assert.match(source, /path: \["appAccess", "signInUrl"\]/);
  assert.match(source, /path: \["appAccess", platform, "storeUrl"\]/);
  const marker = "const signInUrl = value.appAccess?.signInUrl;";
  const checks = source.indexOf(marker);
  const earlyReturn = source.indexOf("if (!value.public) return;");
  assert.ok(checks !== -1 && checks < earlyReturn);
});

function syntheticProduct(appAccess, publicState = true) {
  return {
    slug: "sotro",
    name: "Fixture Sổ Trọ",
    shortDescription: "Synthetic record for destination authority checks.",
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
    appAccess,
    endorsement: "A BlueSkyz Labs product",
    featuredTier: "hero",
    displayOrder: 1,
    public: publicState,
    sourceRevision: "abcdef1",
    lastReviewedAt: "2026-09-27",
  };
}

test("canonical schema fails closed on deceptive product records", () => {
  const good = {
    signInUrl: "https://yenlume.blueskyzlabs.com/login",
    android: {
      state: "available",
      storeUrl: "https://play.google.com/store/apps/details?id=x",
    },
    ios: {
      state: "available",
      storeUrl: "https://apps.apple.com/vn/app/fixture/id12345",
    },
  };
  assert.equal(productSchema.safeParse(syntheticProduct(good)).success, true);

  const altered = {
    ...good,
    signInUrl: "https://sotam.blueskyzlabs.com/auth/login",
    android: {
      state: "available",
      storeUrl: "https://play.google.com.evil.co/store/apps/details?id=x",
    },
    ios: {
      state: "available",
      storeUrl: "https://apps.apple.com/vn/app/not-a-listing",
    },
  };
  for (const publicState of [true, false]) {
    const result = productSchema.safeParse(
      syntheticProduct(altered, publicState),
    );
    assert.equal(result.success, false);
    if (result.success) continue;
    const paths = result.error.issues.map((issue) => issue.path.join("."));
    for (const key of [
      "appAccess.signInUrl",
      "appAccess.android.storeUrl",
      "appAccess.ios.storeUrl",
    ]) {
      assert.ok(paths.includes(key), `missing authority violation for ${key}`);
    }
  }
});
