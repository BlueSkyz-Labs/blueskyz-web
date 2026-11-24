import { expect, test } from "@playwright/test";

/**
 * Story cards on the showcase (Owner 2026-11-24): one card per story between
 * the hero and the first chapter. Pinned here: one card per public story,
 * each links to its own chapter, the stroke field is a CSS mask (no canvas),
 * the hover frames stay hidden until a card is hovered or focused, and the
 * row never makes the page scroll sideways on a phone.
 */
const LOCALES = ["en", "vi", "zh", "zh-hant"] as const;
const ACTS = ["sotro", "sotam", "vungtaylai"] as const;

for (const lang of LOCALES) {
  test(`${lang}: one story card per chapter, each linking to it`, async ({
    page,
  }) => {
    await page.goto(`/${lang}/showcase/`);
    const cards = page.locator("[data-card]");
    await expect(cards).toHaveCount(ACTS.length);
    for (const [index, slug] of ACTS.entries()) {
      const card = cards.nth(index);
      await expect(card).toHaveAttribute("href", `#${slug}`);
      await expect(card.locator(".sc-tale__line")).not.toBeEmpty();
      await expect(page.locator(`section#${slug}`)).toHaveCount(1);
    }
    await expect(page.locator("[data-showcase] canvas")).toHaveCount(0);
  });
}

test("the frames appear on hover and leave with the pointer", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name.includes("mobile"), "needs a fine pointer");
  await page.goto("/en/showcase/");
  const card = page.locator("[data-card]").first();
  await card.scrollIntoViewIfNeeded();
  const box = card.locator("[data-box]").first();
  await expect(box).toHaveCSS("opacity", "0");
  await card.hover({ position: { x: 150, y: 160 } });
  await expect(card).toHaveAttribute("data-lit", "");
  await expect(box).toHaveCSS("opacity", "1");
  await expect(card.locator("[data-tag]").first()).toHaveText(/^\d+, \d+$/);
  await page.mouse.move(2, 2);
  await expect(card).not.toHaveAttribute("data-lit", "");
});

test("a phone row of cards does not scroll the page sideways", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto("/vi/showcase/");
  await page.locator("[data-card]").first().scrollIntoViewIfNeeded();
  const wide = await page.evaluate(
    () => document.documentElement.scrollWidth > innerWidth,
  );
  expect(wide).toBe(false);
});
