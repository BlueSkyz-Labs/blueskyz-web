import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { publishedPosts } from "./helpers/journal-source";

/**
 * Journey card rail (Owner 2026-11-24): each branch of the Journey index is a
 * horizontal row of post cards. Without JS every card is a crawlable link to
 * its post and the row scrolls natively; with JS the row gains previous /
 * next buttons and a plain click opens a preview dialog that Escape, the
 * close button and a click outside all dismiss, returning focus to the card.
 */
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
const INDEXES = [
  { path: "/vi/journal/", lang: "vi", close: "Đóng", read: "Đọc bài viết" },
  { path: "/en/journal/", lang: "en", close: "Close", read: "Read the post" },
] as const;

for (const index of INDEXES) {
  test.describe(`${index.path} card rail`, () => {
    test("without JS every card is a link to its post and no control shows", async ({
      browser,
    }) => {
      const context = await browser.newContext({ javaScriptEnabled: false });
      const page = await context.newPage();
      await page.goto(index.path);
      const expected = publishedPosts(index.lang);
      const links = page.locator("[data-journal-card-link]");
      await expect(links).toHaveCount(expected.length);
      for (const post of expected) {
        await expect(
          page.locator(
            `[data-journal-item="${post.id}"] a[href="/${index.lang}/journal/${post.id}/"]`,
          ),
        ).toHaveCount(1);
      }
      await expect(page.locator("[data-journal-rail-controls]")).toBeHidden();
      await expect(page.locator("[data-journal-preview]")).toBeHidden();
      // Each card carries its lead illustration with real alt text.
      for (const img of await page
        .locator("[data-journal-card-art] img")
        .all()) {
        expect((await img.getAttribute("alt"))!.length).toBeGreaterThan(19);
      }
      await context.close();
    });

    test("the buttons move the row and disable at its ends", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(index.path);
      const rail = page.locator("[data-journal-rail]").first();
      const prev = page.locator("[data-journal-rail-prev]").first();
      const next = page.locator("[data-journal-rail-next]").first();
      await expect(prev).toBeVisible();
      await expect(prev).toBeDisabled();
      await expect(next).toBeEnabled();
      await next.click();
      await expect
        .poll(() => rail.evaluate((el) => el.scrollLeft))
        .toBeGreaterThan(100);
      await expect(prev).toBeEnabled();
      await rail.evaluate((el) => (el.scrollLeft = el.scrollWidth));
      await expect(next).toBeDisabled();
    });

    test("a card opens the preview; Escape closes it and focus returns", async ({
      page,
    }) => {
      await page.goto(index.path);
      const link = page.locator("[data-journal-card-link]").nth(1);
      const href = (await link.getAttribute("href"))!;
      const title = (await link.textContent())!.trim();
      await expect(link).toHaveAttribute("aria-haspopup", "dialog");
      await link.click();
      const dialog = page.locator("[data-journal-preview]");
      await expect(dialog).toBeVisible();
      await expect(page).toHaveURL(new RegExp(`${index.path}$`));
      await expect(
        dialog.getByRole("heading", { level: 2, name: title }),
      ).toBeVisible();
      await expect(
        dialog.getByRole("link", { name: index.read }),
      ).toHaveAttribute("href", href);
      await expect(
        dialog.getByRole("button", { name: index.close }),
      ).toBeFocused();
      const results = await new AxeBuilder({ page })
        .withTags(AXE_TAGS)
        .analyze();
      expect(results.violations).toEqual([]);
      await page.keyboard.press("Escape");
      await expect(dialog).toBeHidden();
      await expect(link).toBeFocused();
    });

    test("the close button and a click outside both close the preview", async ({
      page,
    }) => {
      await page.goto(index.path);
      const link = page.locator("[data-journal-card-link]").first();
      const dialog = page.locator("[data-journal-preview]");
      await link.click();
      await expect(dialog).toBeVisible();
      await dialog.getByRole("button", { name: index.close }).click();
      await expect(dialog).toBeHidden();
      await link.click();
      await expect(dialog).toBeVisible();
      await page.mouse.click(4, 4);
      await expect(dialog).toBeHidden();
    });

    test("the preview's read link goes to the post", async ({ page }) => {
      await page.goto(index.path);
      const link = page.locator("[data-journal-card-link]").first();
      const href = (await link.getAttribute("href"))!;
      await link.click();
      await page
        .locator("[data-journal-preview]")
        .getByRole("link", { name: index.read })
        .click();
      await expect(page).toHaveURL(new RegExp(`${href}$`));
    });
  });
}
