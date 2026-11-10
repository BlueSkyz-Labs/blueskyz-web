import { expect, test, type Page } from "@playwright/test";
import { hasPublicProducts } from "./product-helpers.ts";

/**
 * v8 W2 — Home elevation: one focal object, no orphan links, bounded height.
 *
 * Negative proof: every checker below is also run against a page that has been
 * deliberately broken (a second focal object, a link-only block) and must
 * report the defect. `V8_HOME_BREAK=1` additionally breaks the page inside the
 * positive tests so the failing output can be shown in the PR.
 */

async function breakFocal(page: Page) {
  await page.evaluate(() => {
    const clone = document.createElement("div");
    clone.setAttribute("data-hero-focal", "");
    clone.textContent = "second focal";
    document.querySelector("[data-hero]")!.appendChild(clone);
  });
}

async function breakOrphan(page: Page) {
  await page.evaluate(() => {
    const row = document.createElement("div");
    row.innerHTML = '<a href="/en/products/">Explore products</a>';
    document.querySelector("[data-hero]")!.appendChild(row);
  });
}

/** Visible links in main whose direct (non-heading) parent holds only the link. */
async function linkOnlyBlocks(page: Page): Promise<string[]> {
  return page.evaluate(() =>
    [...document.querySelectorAll("main a[href]")]
      .filter((a) => a.getClientRects().length > 0)
      .filter((a) => {
        const parent = a.parentElement;
        if (!parent || /^(H[1-6]|MAIN|BODY)$/.test(parent.tagName))
          return false;
        return (
          (parent.textContent ?? "").trim() === (a.textContent ?? "").trim()
        );
      })
      .map((a) => (a.textContent ?? "").trim()),
  );
}

const focalCount = (page: Page) => page.locator("[data-hero-focal]").count();

for (const vp of [
  { width: 390, height: 844 },
  { width: 1024, height: 768 },
  { width: 1440, height: 900 },
]) {
  test(`/en/ at ${vp.width}: exactly one hero focal object`, async ({
    page,
  }) => {
    test.skip(!hasPublicProducts, "No published hero product is available");
    await page.setViewportSize(vp);
    await page.goto("/en/");
    if (process.env.V8_HOME_BREAK) await breakFocal(page);
    expect(await focalCount(page)).toBe(1);
    await expect(page.locator("[data-hero-focal] img")).toBeVisible();
  });
}

test("/en/ at 1440: primary CTA is in the first viewport", async ({ page }) => {
  test.skip(!hasPublicProducts, "No published hero product is available");
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/en/");
  const box = await page.locator("[data-hero-primary]").boundingBox();
  expect(box!.y + box!.height).toBeLessThanOrEqual(900);
});

test("/en/ at 390: primary CTA is inside two viewports and the capture is ~220px", async ({
  page,
}) => {
  test.skip(!hasPublicProducts, "No published hero product is available");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/en/");
  const box = await page.locator("[data-hero-primary]").boundingBox();
  expect(box!.y + box!.height).toBeLessThanOrEqual(844 * 2);
  const img = await page.locator("[data-hero-focal] img").boundingBox();
  expect(img!.width).toBeGreaterThanOrEqual(200);
  expect(img!.width).toBeLessThanOrEqual(240);
});

test("/en/ at 1440: the capture is at least 280px wide and not cropped", async ({
  page,
}) => {
  test.skip(!hasPublicProducts, "No published hero product is available");
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/en/");
  const img = await page.locator("[data-hero-focal] img").boundingBox();
  expect(img!.width).toBeGreaterThanOrEqual(280);
  expect(img!.y).toBeGreaterThanOrEqual(0);
  expect(img!.height / img!.width).toBeCloseTo(1440 / 780, 1);
});

for (const lang of ["en", "vi", "zh", "zh-hant"] as const) {
  test(`/${lang}/ has no link-only blocks in main`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/${lang}/`);
    if (process.env.V8_HOME_BREAK) await breakOrphan(page);
    expect(await linkOnlyBlocks(page)).toEqual([]);
  });
}

// Home stage (Owner 2026-11-10): the flagship console is shown whole, the
// products in development are cards and the page closes on the house line, so
// the budget moves from 2900 to 3250px. It stays a budget: about three and a
// half desktop screens, with nothing added that is not already authored.
test("/en/ at 1440: page height stays within 3250px", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/en/");
  const height = await page.evaluate(
    () => document.documentElement.scrollHeight,
  );
  expect(height).toBeLessThanOrEqual(3250);
});

test("the home proof list keeps two points and one capture label per group", async ({
  page,
}) => {
  test.skip(!hasPublicProducts, "No published hero product is available");
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/en/");
  await expect(page.locator("[data-home-proof-list] li")).toHaveCount(2);
  await expect(page.locator("[data-flagship-theatre] figcaption")).toHaveCount(
    0,
  );
});

test("negative proof: a second [data-hero-focal] is detected", async ({
  page,
}) => {
  await page.goto("/en/");
  expect(await focalCount(page)).toBe(1);
  await breakFocal(page);
  expect(await focalCount(page)).toBe(2);
});

test("negative proof: a link-only block is detected", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/en/");
  expect(await linkOnlyBlocks(page)).toEqual([]);
  await breakOrphan(page);
  expect(await linkOnlyBlocks(page)).toEqual(["Explore products"]);
});
