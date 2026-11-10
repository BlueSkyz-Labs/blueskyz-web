import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/**
 * Showcase story (Owner 2026-11-10): three products, three short stories,
 * real screens in drawn device frames. These tests pin the experience
 * contract: static first, real images, no canvas, calm under reduced motion,
 * no sideways scroll on a phone, and one current screen per pinned stage.
 */
const LOCALES = ["en", "vi", "zh", "zh-hant"] as const;
const ACTS = ["sotro", "sotam", "vungtaylai"] as const;
const route = (lang: string): string => `/${lang}/showcase/`;

/** Scroll the whole page once so every lazy image is requested. */
async function scrollThrough(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const step = Math.max(200, Math.floor(innerHeight * 0.8));
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 40));
    }
    scrollTo(0, 0);
  });
}

for (const lang of LOCALES) {
  test(`${lang}: three stories, each with four screens and a folding screen`, async ({
    page,
  }) => {
    await page.goto(route(lang));
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("h1")).toBeVisible();
    for (const slug of ACTS) {
      const act = page.locator(`section#${slug}`);
      await expect(act.locator("h2")).toBeVisible();
      await expect(act.locator(".sc-badge")).not.toBeEmpty();
      await expect(act.locator("[data-shot] img")).toHaveCount(4);
      await expect(act.locator(".sc-fold")).toHaveCount(1);
      await expect(
        act.locator(`a[href="/${lang}/products/${slug}/"]`),
      ).toHaveCount(1);
    }
    // Every described image carries its own description.
    const alts = await page
      .locator("[data-shot] img, .sc-fold__half--l img, .sc-desk img")
      .evaluateAll((images) =>
        images.map((image) => (image.getAttribute("alt") ?? "").trim()),
      );
    expect(alts).toHaveLength(16);
    for (const alt of alts) expect(alt.length).toBeGreaterThan(20);
    // Depth is CSS only: no canvas anywhere in the story.
    await expect(page.locator("[data-showcase] canvas")).toHaveCount(0);
  });
}

test("every screen is a real image that loads", async ({ page }) => {
  await page.goto(route("vi"));
  await scrollThrough(page);
  await expect
    .poll(
      () =>
        page
          .locator("[data-showcase] img")
          .evaluateAll((images) =>
            (images as HTMLImageElement[])
              .filter((image) => !(image.complete && image.naturalWidth > 0))
              .map((image) => image.currentSrc || image.src),
          ),
      { timeout: 15_000 },
    )
    .toEqual([]);
});

test("without JavaScript every chapter shows its own screen", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(route("en"));
  await expect(page.locator("[data-showcase]")).not.toHaveAttribute(
    "data-live",
    /.*/,
  );
  const shots = page.locator("[data-shot]");
  await expect(shots).toHaveCount(12);
  for (let index = 0; index < 12; index += 1) {
    const box = await shots.nth(index).boundingBox();
    expect(box?.height ?? 0).toBeGreaterThan(200);
  }
  await expect(page.locator("[data-step]").first()).toBeVisible();
  await context.close();
});

test("a phone-width screen never scrolls sideways", async ({ browser }) => {
  for (const width of [320, 390]) {
    const context = await browser.newContext({
      viewport: { width, height: 800 },
    });
    const page = await context.newPage();
    await page.goto(route("vi"));
    await scrollThrough(page);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - innerWidth,
    );
    expect(overflow, `sideways overflow at ${width}px`).toBeLessThanOrEqual(0);
    await context.close();
  }
});

test("reduced motion: nothing moves and the folding screen lies flat", async ({
  browser,
}) => {
  const context = await browser.newContext({
    reducedMotion: "reduce",
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();
  await page.goto(route("en"));
  const half = page.locator(".sc-fold__half--l").first();
  await half.scrollIntoViewIfNeeded();
  const state = await page.evaluate(() => ({
    animations: document
      .getAnimations()
      .filter((animation) =>
        (animation.effect as KeyframeEffect | null)?.target?.closest(
          "[data-showcase]",
        ),
      ).length,
    transform: getComputedStyle(
      document.querySelector(".sc-fold__half--l") as Element,
    ).transform,
  }));
  expect(state.animations).toBe(0);
  expect(state.transform).toBe("none");
  await context.close();
});

test("wide screens pin one stage and show exactly one current screen", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();
  await page.goto(route("en"));
  await expect(page.locator("[data-showcase]")).toHaveAttribute(
    "data-live",
    "",
  );
  const reel = page.locator("section#sotro [data-reel]");
  const third = reel.locator("[data-step]").nth(2);
  await third.evaluate((element) =>
    element.scrollIntoView({ block: "center", behavior: "instant" }),
  );
  await expect(third).toHaveAttribute("data-state", "active");
  await expect(reel.locator('[data-shot][data-state="active"]')).toHaveCount(1);
  await expect(reel.locator("[data-shot]").nth(2)).toHaveAttribute(
    "data-state",
    "active",
  );
  await context.close();
});

for (const lang of ["en", "vi"] as const) {
  test(`axe has no critical/serious violations on ${route(lang)}`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(route(lang));
    await scrollThrough(page);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    const blocking = results.violations.filter(
      (violation) =>
        violation.impact === "critical" || violation.impact === "serious",
    );
    expect(
      blocking.map((violation) => `${violation.id}: ${violation.help}`),
    ).toEqual([]);
  });
}

test("the products index links to the showcase", async ({ page }) => {
  await page.goto("/vi/products/");
  const link = page.locator('main a[href="/vi/showcase/"]');
  await expect(link).toHaveCount(1);
  await link.click();
  await expect(page).toHaveURL(/\/vi\/showcase\/$/);
});
