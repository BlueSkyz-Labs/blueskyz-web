import { expect, test } from "@playwright/test";

/**
 * Horizon/Sail W2: visitors can inspect the source-owned full-size image
 * without a lightbox, fabricated zoom or JavaScript dependency.
 * The provenance/sample-data disclosure stays on the product page.
 */
for (const lang of ["en", "vi", "zh", "zh-hant"] as const) {
  test(`${lang}: story and gallery link to the actual showcase capture`, async ({
    page,
  }) => {
    await page.goto(`/${lang}/products/sotro/`);

    const story = page.locator("[data-feature-story]");
    const chapter = story.locator("[data-story-chapter]").first();
    const original = chapter.locator("[data-capture-inspect]");
    const capturedSrc = await chapter.locator("figure img").getAttribute("src");
    expect(capturedSrc).toMatch(/^\/products\/sotro\/showcase\/.*\.webp$/);
    await expect(original).toHaveAttribute("href", capturedSrc!);
    await expect(original).toHaveAttribute("aria-label", /.+/);
    await expect(original).toBeVisible();

    const coda = story.locator("[data-story-coda]");
    const codaSrc = await coda.locator("figure img").getAttribute("src");
    await expect(coda.locator("[data-capture-inspect]")).toHaveAttribute(
      "href",
      codaSrc!,
    );

    const more = page.locator("[data-showcase-more]");
    await more.locator("summary").click();
    const gallery = more.locator(".showcase__phone").first();
    const gallerySrc = await gallery.locator("img").getAttribute("src");
    await expect(gallery.locator("[data-capture-inspect]")).toHaveAttribute(
      "href",
      gallerySrc!,
    );
    await expect(gallery.locator("[data-capture-inspect]")).toBeVisible();

    await expect(page.locator("[data-showcase-disclosure]")).toContainText(
      /sample|mẫu|示例|範例/i,
    );
  });
}

test("original capture stays inspectable without JavaScript at phone width", async ({
  browser,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
  });
  try {
    const page = await context.newPage();
    await page.goto("/vi/products/sotro/");
    const chapter = page.locator("[data-story-chapter]").first();
    const imageSrc = await chapter.locator("img").getAttribute("src");
    const inspect = chapter.locator("[data-capture-inspect]");
    await expect(inspect).toHaveAttribute("href", imageSrc!);
    await expect(inspect).toBeVisible();
  } finally {
    await context.close();
  }
});
