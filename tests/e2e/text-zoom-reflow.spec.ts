import { expect, test, type Page } from "@playwright/test";

/**
 * WCAG 1.4.4 / 1.4.10 / 1.4.12 reflow at 320px with 200% text and text
 * spacing, for the two layouts that scrolled sideways:
 * - product profile header: the rem-sized icon grew with the text and left
 *   the H1 about 40px, so the title overflowed by 45–77px;
 * - zh / zh-Hant About labels: each build-time .cjk-word span was its own
 *   flex item, so the label could not wrap (52px overflow) and showed a
 *   0.75rem gap between Chinese words even at normal size.
 *
 * Each case has a negative proof that restores the broken layout and
 * expects the same check to fail.
 */

const ZOOM_CSS = `html{font-size:200%!important} *{letter-spacing:.12em!important;word-spacing:.16em!important;line-height:1.5!important}`;
const LOCALES = ["en", "vi", "zh", "zh-hant"] as const;

async function overflow(page: Page, extraCss?: string): Promise<number> {
  await page.addStyleTag({ content: ZOOM_CSS + (extraCss ?? "") });
  await page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      ),
  );
  return page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  );
}

/** Largest horizontal gap between consecutive Chinese words of a label. */
async function wordGap(page: Page, extraCss?: string): Promise<number> {
  if (extraCss) await page.addStyleTag({ content: extraCss });
  return page.evaluate(() => {
    const words = [...document.querySelectorAll("#about-make .cjk-word")].map(
      (el) => el.getBoundingClientRect(),
    );
    let max = 0;
    for (let i = 1; i < words.length; i++) {
      if (Math.abs(words[i].top - words[i - 1].top) > 1) continue;
      max = Math.max(max, words[i].left - words[i - 1].right);
    }
    return words.length > 1 ? max : Number.NaN;
  });
}

test.describe("text zoom reflow at 320px", () => {
  test.use({ viewport: { width: 320, height: 800 } });

  for (const locale of LOCALES) {
    for (const slug of ["sotro", "sotam"]) {
      test(`/${locale}/products/${slug}/ does not scroll sideways`, async ({
        page,
      }) => {
        await page.goto(`/${locale}/products/${slug}/`);
        expect(await overflow(page)).toBeLessThanOrEqual(1);
      });
    }
  }

  for (const locale of ["zh", "zh-hant"] as const) {
    test(`/${locale}/about/ labels wrap instead of overflowing`, async ({
      page,
    }) => {
      await page.goto(`/${locale}/about/`);
      expect(await overflow(page)).toBeLessThanOrEqual(1);
    });
  }

  test("negative proof: a header that cannot wrap overflows", async ({
    page,
  }) => {
    await page.goto("/en/products/sotam/");
    const broken = await overflow(
      page,
      "header:has([data-product-profile-title]){flex-wrap:nowrap!important}" +
        "header:has([data-product-profile-title])>div:last-child{flex:0 1 auto!important}" +
        // The title now breaks inside a one-word name (YENLUME); restore the
        // old behaviour so this still proves the header check can fail.
        "[data-product-profile-title]{overflow-wrap:normal!important}",
    );
    expect(broken).toBeGreaterThan(1);
  });

  test("negative proof: words as separate flex items overflow", async ({
    page,
  }) => {
    await page.goto("/zh/about/");
    const broken = await overflow(
      page,
      ".about-label__text{display:contents!important}",
    );
    expect(broken).toBeGreaterThan(1);
  });
});

test.describe("Chinese About labels at normal size", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("no gap between words of a label", async ({ page }) => {
    await page.goto("/zh/about/");
    expect(await wordGap(page)).toBeLessThanOrEqual(1);
  });

  test("negative proof: words as separate flex items are spaced apart", async ({
    page,
  }) => {
    await page.goto("/zh/about/");
    expect(
      await wordGap(page, ".about-label__text{display:contents!important}"),
    ).toBeGreaterThan(4);
  });
});
