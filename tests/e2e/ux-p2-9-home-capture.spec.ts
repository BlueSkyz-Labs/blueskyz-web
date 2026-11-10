import { expect, test, type Page } from "@playwright/test";

/**
 * UX P2-9 — the home flagship capture must be readable. The full owner console
 * scaled into the theatre slot rendered its text at 4-7px. Wide screens first
 * showed the capture cropped to the collections panel. Since the home stage
 * (Owner 2026-11-10) the act is full width, so wide screens show the whole
 * recorded console at a larger scale than the crop had (0.45 or more rendered
 * px per source px, against the crop's 0.36 floor) and no crop is needed;
 * narrow screens show the recorded phone capture of the same screen. Exactly
 * one is visible, and the hidden one is never downloaded.
 */
const THEATRE = "[data-flagship-theatre]";

/** Rendered px per source px. Body text in both captures is ~30 source px. */
export const readable = (scale: number, minScale: number) => scale >= minScale;

const visibleCapture = async (page: Page) => {
  const figure = page
    .locator(`${THEATRE} [data-flagship-capture]`)
    .filter({ visible: true });
  await expect(figure).toHaveCount(1);
  const img = figure.locator("img");
  await img.scrollIntoViewIfNeeded();
  await expect(img).toHaveJSProperty("complete", true);
  return {
    surface: await figure.getAttribute("data-capture-surface"),
    cropped: (await figure.getAttribute("data-capture-crop")) !== null,
    scale: await img.evaluate(
      (el) =>
        el.getBoundingClientRect().width / Number(el.getAttribute("width")),
    ),
  };
};

test("negative proof: the uncropped console at its old width is not readable", () => {
  // Before P2-9: 1920px source at 592px (1440) and 308px (390).
  expect(readable(592 / 1920, 0.36)).toBe(false);
  expect(readable(308 / 1920, 0.28)).toBe(false);
  expect(readable(0.39, 0.36)).toBe(true);
});

for (const lang of ["en", "vi", "zh", "zh-hant"]) {
  test(`/${lang}/ 1440: the theatre shows the whole console at a readable scale`, async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    const page = await context.newPage();
    await page.goto(`/${lang}/`);
    const c = await visibleCapture(page);
    expect(c.surface).toBe("desktop");
    expect(c.cropped).toBe(false);
    expect(readable(c.scale, 0.45), String(c.scale)).toBe(true);
    await context.close();
  });

  test(`/${lang}/ 390: the theatre shows the phone capture and never loads the console`, async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
    });
    const page = await context.newPage();
    const fetched: string[] = [];
    page.on("request", (r) => fetched.push(r.url()));
    await page.goto(`/${lang}/`);
    const c = await visibleCapture(page);
    expect(c.surface).toBe("phone");
    expect(readable(c.scale, 0.28), String(c.scale)).toBe(true);
    expect(fetched.filter((u) => u.includes("mgr-02-payments"))).toEqual([]);
    await context.close();
  });
}
