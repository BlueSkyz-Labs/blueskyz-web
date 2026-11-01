import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/**
 * Product guide, Apple switcher-guide layout (Owner 2026-10-29).
 * Chapters are derived from consecutive steps by the same role, so the
 * Sổ Trọ record (owner ×3, family ×4, owner ×1) yields three chapters whose
 * lists keep one continuous step numbering.
 */
const LANGS = ["en", "vi", "zh", "zh-hant"] as const;
const PATH = (lang: string) => `/${lang}/products/sotro/guide/`;

for (const lang of LANGS) {
  test(`${lang}: guide has no WCAG A/AA violations`, async ({ page }) => {
    await page.goto(PATH(lang));
    const backLink = page.locator(".guide__back");
    const visibleName = (await backLink.innerText())
      .replace(/\s+/g, " ")
      .trim();
    await expect(backLink).toHaveAccessibleName(visibleName);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual(
      [],
    );
  });
}

test("chapters follow role runs and keep one step numbering", async ({
  page,
}) => {
  await page.goto(PATH("en"));
  const chapters = page.locator("[data-guide-chapter]");
  await expect(chapters).toHaveCount(3);
  const starts = await page
    .locator("[data-guide-chapter] ol.guide__steps")
    .evaluateAll((lists) =>
      lists.map((l) => [
        (l as HTMLOListElement).start,
        l.querySelectorAll(":scope > li").length,
      ]),
    );
  expect(starts).toEqual([
    [1, 3],
    [4, 4],
    [8, 1],
  ]);
  await expect(page.locator(".guide__step")).toHaveCount(8);
  // The local nav links each chapter by its step range.
  await expect(page.locator("[data-chapter-link]")).toHaveText([
    "Steps 1–3",
    "Steps 4–7",
    "Step 8",
  ]);
});

for (const lang of LANGS) {
  test(`${lang}: guide chapter regions have unique accessible names`, async ({
    page,
  }) => {
    await page.goto(PATH(lang));
    if (lang === "en") {
      await expect(
        page.locator("#chapter-1 [data-gallery]"),
      ).toHaveAccessibleName(/^Steps 1–3 Owner.*computer$/);
      await expect(
        page.locator("#chapter-2 [data-gallery]"),
      ).toHaveAccessibleName(/^Steps 4–7 Family.*phone$/);
      await expect(
        page.locator("#chapter-3 [data-gallery]"),
      ).toHaveAccessibleName(/^Step 8 Owner.*computer$/);
    }
    const results = await new AxeBuilder({ page })
      .withRules(["landmark-unique"])
      .analyze();
    expect(
      results.violations.flatMap((v) =>
        v.nodes.map((node) => `${v.id}: ${node.target.join(" ")}`),
      ),
    ).toEqual([]);
  });
}

test("the step switcher centres the chosen card and marks it", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(PATH("en"));
  const chapter = page.locator("#chapter-2");
  const sw = chapter.locator("[data-gallery-switch]");
  await expect(sw).toBeVisible();
  await expect(sw.locator("button")).toHaveCount(4);
  await sw.locator("button").nth(2).click();
  await expect(sw.locator('button[aria-pressed="true"]')).toHaveText("Step 6");
  const offset = await chapter.evaluate((el) => {
    const gallery = el.querySelector<HTMLElement>("[data-gallery]")!;
    const card = el.querySelector<HTMLElement>(".guide__step[data-active]")!;
    const g = gallery.getBoundingClientRect();
    const c = card.getBoundingClientRect();
    return Math.abs(c.left + c.width / 2 - (g.left + g.width / 2));
  });
  expect(offset).toBeLessThan(4);
  // A single-step chapter has no switcher.
  await expect(page.locator("#chapter-3 [data-gallery-switch]")).toHaveCount(0);
});

test("the local nav docks under the sticky site header", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(PATH("en"));
  await page.evaluate(() => window.scrollTo(0, 1800));
  await page.waitForTimeout(200);
  const [header, nav] = await Promise.all([
    page.locator(".header-glass").boundingBox(),
    page.locator(".guide__localnav").boundingBox(),
  ]);
  expect(Math.abs(nav!.y - (header!.y + header!.height))).toBeLessThan(2);
});

test("phone width: no horizontal page scroll", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto(PATH("vi"));
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });
  test("every step is readable and no switcher is shown", async ({ page }) => {
    await page.goto(PATH("vi"));
    await expect(page.locator("[data-gallery-switch]:visible")).toHaveCount(0);
    const dimmed = await page
      .locator(".guide__step, .guide__shot")
      .evaluateAll(
        (cards) =>
          cards.filter((c) => getComputedStyle(c).opacity !== "1").length,
      );
    expect(dimmed).toBe(0);
    await expect(page.locator(".guide__step h3")).toHaveCount(8);
  });
});

test.describe("forced colors", () => {
  test.use({ forcedColors: "active", viewport: { width: 1440, height: 900 } });
  test("the chosen step and current chapter stay distinguishable", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(PATH("en"));
    const sw = page.locator("#chapter-2 [data-gallery-switch] button");
    await sw.nth(1).click();
    await expect(sw.nth(1)).toHaveAttribute("aria-pressed", "true");
    const bg = (i: number) =>
      sw.nth(i).evaluate((b) => getComputedStyle(b).backgroundColor);
    expect(await bg(1)).not.toBe(await bg(0));
    // Under forced colours a transparent fill and the Canvas fill look
    // the same, so the pressed fill must not be Canvas either.
    const canvas = await page.evaluate(() => {
      const probe = document.createElement("div");
      probe.style.background = "Canvas";
      document.body.append(probe);
      const c = getComputedStyle(probe).backgroundColor;
      probe.remove();
      return c;
    });
    expect(await bg(1)).not.toBe(canvas);

    await page.evaluate(() => window.scrollTo(0, 1800));
    const current = page.locator('[data-chapter-link][aria-current="true"]');
    await expect(current).toHaveCount(1);
    const other = page.locator(
      '[data-chapter-link]:not([aria-current="true"])',
    );
    const line = (l: typeof current) =>
      l.evaluate((a) => getComputedStyle(a).borderBottomColor);
    expect(await line(current)).not.toBe(await line(other.first()));
  });
});
