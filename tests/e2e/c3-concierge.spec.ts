import { expect, test } from "@playwright/test";

/*
 * C3-E deterministic step (Owner decision 2026-10-05): the concierge corpus
 * feeds the existing Command Navigator instead of a second surface on /verify/.
 * Corpus text only widens what the navigator's search matches; it adds no item,
 * link or visible copy. No model, no network.
 *
 * Negative proof: on a build without the corpus feed, "landlord" and "cookies"
 * match no product or route, so the first two tests fail.
 */

test.use({ viewport: { width: 1280, height: 800 } });

const visible = "[data-command-item]:not([hidden])";

test("a product is found by its published description", async ({ page }) => {
  await page.goto("/en/");
  await page.keyboard.press("Control+k");
  await page.locator("[data-command-input]").fill("landlord");
  const items = page.locator(visible);
  await expect(items).toHaveCount(1);
  await expect(items.first().locator("a")).toHaveAttribute(
    "href",
    "/en/products/sotro/",
  );
});

test("a surface is found by what its published claims say", async ({
  page,
}) => {
  await page.goto("/en/");
  await page.keyboard.press("Control+k");
  await page.locator("[data-command-input]").fill("cookies");
  await expect(
    page.locator(`${visible}:has(a[href="/en/privacy/"])`),
  ).toHaveCount(1);
});

// Round-4 fix proof: the corpus feed must use each locale's OWN copy. The
// Vietnamese phrase below exists only in the VI shortDescription, so this
// fails if the feed ever reads the English-only top-level field again.
test("a product is found by its locale's own description", async ({ page }) => {
  await page.goto("/vi/");
  await page.keyboard.press("Control+k");
  await page.locator("[data-command-input]").fill("nhà cho thuê");
  const items = page.locator(visible);
  await expect(items).toHaveCount(1);
  await expect(items.first().locator("a")).toHaveAttribute(
    "href",
    "/vi/products/sotro/",
  );
});

test("/verify/ renders no separate concierge surface", async ({ page }) => {
  for (const lang of ["en", "vi", "zh", "zh-hant"]) {
    await page.goto(`/${lang}/verify/`);
    await expect(page.locator("[data-concierge]")).toHaveCount(0);
  }
});
