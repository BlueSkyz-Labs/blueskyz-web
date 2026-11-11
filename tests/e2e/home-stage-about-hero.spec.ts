import { expect, test, type Page } from "@playwright/test";

/**
 * Home stage and About hero (Owner 2026-11-10).
 *
 * The home closes on the house line with the same three next steps, the
 * products in development are cards from md, and About opens on one ink band
 * that carries the page title, mission, founder identity and operating year.
 * These tests pin the structure; the copy itself is pinned by its own specs.
 */
const LANGS = ["en", "vi", "zh", "zh-hant"] as const;

const overflow = (page: Page) =>
  page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  );

const tracks = (page: Page, selector: string) =>
  page.locator(selector).evaluate(
    (el) =>
      getComputedStyle(el)
        .gridTemplateColumns.split(" ")
        .filter((part) => part.trim().length > 0).length,
  );

for (const lang of LANGS) {
  test(`/${lang}/ closes on the house line with the three next steps`, async ({
    page,
  }) => {
    await page.goto(`/${lang}/`);
    const close = page.locator("section[data-home-close]");
    await expect(close).toHaveCount(1);
    await expect(close.locator("h2")).toHaveCount(1);
    await expect(close.locator("h2")).not.toHaveText("");
    // The artwork is the brand sail drawn inline: decorative, and no image
    // request is added to the home's byte budget.
    await expect(close.locator('[aria-hidden="true"] > svg')).toHaveCount(1);
    await expect(close.locator("img")).toHaveCount(0);
    const links = close.locator("nav[data-home-next-steps] a");
    await expect(links).toHaveCount(3);
    expect(
      await links.evaluateAll((all) => all.map((a) => a.getAttribute("href"))),
    ).toEqual([`/${lang}/verify/`, `/${lang}/about/`, `/${lang}/contact/`]);
    const order = await page.evaluate(() => {
      const band = document.querySelector("[data-home-close]")!;
      const house = document.querySelector("[data-product-house]")!;
      const footer = document.querySelector("footer")!;
      return {
        afterHouse: Boolean(
          house.compareDocumentPosition(band) &
          Node.DOCUMENT_POSITION_FOLLOWING,
        ),
        beforeFooter: Boolean(
          band.compareDocumentPosition(footer) &
          Node.DOCUMENT_POSITION_FOLLOWING,
        ),
      };
    });
    expect(order).toEqual({ afterHouse: true, beforeFooter: true });
  });

  test(`/${lang}/ products in development are two cards wide, one on a phone`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/${lang}/`);
    expect(await tracks(page, ".product-rows")).toBe(2);
    expect(await overflow(page)).toBeLessThanOrEqual(0);
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await tracks(page, ".product-rows")).toBe(1);
    expect(await overflow(page)).toBeLessThanOrEqual(0);
    const short = await page
      .locator("[data-home-close] a")
      .evaluateAll((all) =>
        all
          .map((a) => Math.round(a.getBoundingClientRect().height))
          .filter((h) => h < 44),
      );
    expect(short).toEqual([]);
  });

  test(`/${lang}/about/ opens on one band with title, mission, founder and year`, async ({
    page,
  }) => {
    await page.goto(`/${lang}/about/`);
    const hero = page.locator("section[data-about-hero]");
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(hero.locator("h1")).toHaveCount(1);
    await expect(hero.locator("[data-about-mission] h2")).toHaveCount(1);
    await expect(hero.locator("[data-about-founder] h2")).toHaveCount(1);
    await expect(
      hero.locator("[data-organization-founding-year] time"),
    ).toHaveAttribute("datetime", /^\d{4}$/);
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      expect(await overflow(page), `overflow at ${width}`).toBeLessThanOrEqual(
        0,
      );
    }
  });
}

test("the band text clears AA contrast on ink in the light theme", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "light" });
  for (const [route, selector] of [
    ["/en/", "[data-home-close] h2"],
    ["/en/about/", "[data-about-hero] h1"],
  ] as const) {
    await page.goto(route);
    const { fg, bg } = await page.locator(selector).evaluate((el) => {
      const band = el.closest("section")!;
      return {
        fg: getComputedStyle(el).color,
        bg: getComputedStyle(band).backgroundColor,
      };
    });
    const lum = (rgb: string) => {
      const [r, g, b] = rgb
        .match(/[\d.]+/g)!
        .slice(0, 3)
        .map((v) => {
          const c = Number(v) / 255;
          return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
        });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const [hi, lo] = [lum(fg), lum(bg)].sort((a, b) => b - a);
    expect((hi + 0.05) / (lo + 0.05), route).toBeGreaterThanOrEqual(4.5);
  }
});

test("negative proof: a close without its next steps is detected", async ({
  page,
}) => {
  await page.goto("/en/");
  await expect(page.locator("[data-home-close] a")).toHaveCount(3);
  await page.evaluate(() =>
    document.querySelector("nav[data-home-next-steps]")?.remove(),
  );
  await expect(page.locator("[data-home-close] a")).toHaveCount(0);
});
