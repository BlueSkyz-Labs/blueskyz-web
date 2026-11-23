import { expect, test, type Browser } from "@playwright/test";

/**
 * UX-U4 (red-team P1-3, P1-5, P1-6): the Sổ Trọ profile.
 * - the PC/web two-sides line sits in the first viewport (guide wording);
 * - product captures ship a real srcset adequate for DPR2 phones;
 * - chapter titles are h3-scale, below the H1;
 * - the page is shorter than at origin/main (441bb03), measured at 1440 and
 *   390 with reduced motion so the static layout is what is compared.
 */
const LANGS = ["en", "vi", "zh", "zh-hant"] as const;
type Lang = (typeof LANGS)[number];

// First sentence of `guide.intro` in src/content/showcases/sotro.yaml.
const SIDES: Record<Lang, string> = {
  en: "YENLUME has two sides: the owner sets things up on a computer, and family members do the daily work on a paired phone.",
  vi: "YENLUME có hai phía: chủ nhà thiết lập trên máy tính, người nhà làm việc hằng ngày trên điện thoại đã kết nối.",
  zh: "YENLUME 分两端：房东在电脑上设置，家人在已配对的手机上处理日常事务。",
  "zh-hant":
    "YENLUME 分兩端：房東在電腦上設定，家人在已配對的手機上處理日常事務。",
};

// Full-page heights at origin/main 441bb03, reduced motion (before numbers).
const MAIN_HEIGHT: Record<"d1440" | "m390", Record<Lang, number>> = {
  d1440: { en: 6731, vi: 6825, zh: 6728, "zh-hant": 6728 },
  m390: { en: 7351, vi: 7416, zh: 7080, "zh-hant": 7105 },
};
// The [data-app-access] box (height + top margin) inside MAIN_HEIGHT, measured
// at 441bb03; it was the same in every locale. Lifecycle status copy lives
// there, outside the chapters, so both sides of the comparison drop it.
const MAIN_ACCESS: Record<"d1440" | "m390", number> = {
  d1440: 42.75,
  m390: 65.5,
};

export const inFirstViewport = (bottom: number, viewportHeight: number) =>
  bottom > 0 && bottom <= viewportHeight;
export const srcsetWidths = (srcset: string) =>
  srcset
    .split(",")
    .map((c) => /(\d+)w\s*$/.exec(c.trim())?.[1])
    .filter((w): w is string => Boolean(w))
    .map(Number);
export const sharpEnough = (candidateW: number, cssW: number, dpr: number) =>
  candidateW >= cssW * dpr * 0.95;
export const smallerThan = (title: number, h1: number) => title < h1;
export const shorter = (now: number, before: number, minGain: number) =>
  now <= before * (1 - minGain);

test("negative proof: every guard predicate can fail", () => {
  expect(inFirstViewport(900, 844)).toBe(false);
  expect(inFirstViewport(0, 844)).toBe(false);
  expect(srcsetWidths("a-480.webp 480w")).toHaveLength(1);
  expect(srcsetWidths("a-480.webp 480w, a.webp 780w")).toEqual([480, 780]);
  expect(sharpEnough(240, 222, 2)).toBe(false);
  expect(sharpEnough(480, 222, 2)).toBe(true);
  expect(smallerThan(44, 44)).toBe(false);
  expect(shorter(6731, 6731, 0.1)).toBe(false);
});

for (const lang of LANGS) {
  for (const [name, viewport] of [
    ["1440", { width: 1440, height: 900 }],
    ["390", { width: 390, height: 844 }],
  ] as const) {
    test(`${lang} ${name}: PC/web line is in the first viewport`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await page.goto(`/${lang}/products/sotro/`);
      const line = page.locator("[data-product-sides]");
      await expect(line).toBeVisible();
      await expect(line).toHaveText(SIDES[lang]);
      const bottom = await line.evaluate(
        (el) => el.getBoundingClientRect().bottom,
      );
      expect(inFirstViewport(bottom, viewport.height), `${bottom}`).toBe(true);
    });
  }

  test(`${lang}: the line reuses the guide wording`, async ({ page }) => {
    await page.goto(`/${lang}/products/sotro/guide/`);
    await expect(page.locator("body")).toContainText(SIDES[lang]);
  });
}

test("negative proof: a product without a guide renders no sides line", async ({
  page,
}) => {
  await page.goto("/en/products/sotam/");
  await expect(page.locator("[data-product-sides]")).toHaveCount(0);
});

async function ctx(browser: Browser, w: number, h: number, dpr: number) {
  return browser.newContext({
    viewport: { width: w, height: h },
    deviceScaleFactor: dpr,
    reducedMotion: "reduce",
  });
}

// Full-page heights at origin/main 441bb03 with motion allowed (sticky stage).
const MAIN_MOTION_1440 = { en: 7551, vi: 7645 } as const;
for (const lang of ["en", "vi"] as const) {
  test(`${lang} 1440 motion allowed: the page is at least 6% shorter`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/${lang}/products/sotro/`);
    const height = await page.evaluate(
      () => document.documentElement.scrollHeight,
    );
    expect(
      shorter(height, MAIN_MOTION_1440[lang], 0.06),
      `${height} vs main ${MAIN_MOTION_1440[lang]}`,
    ).toBe(true);
  });
}

for (const lang of LANGS) {
  test(`${lang}: captures have a real srcset sharp at DPR2 on a phone`, async ({
    browser,
  }) => {
    const context = await ctx(browser, 390, 844, 2);
    const page = await context.newPage();
    await page.goto(`/${lang}/products/sotro/`);
    const imgs = page.locator("[data-feature-story] img");
    expect(await imgs.count()).toBeGreaterThanOrEqual(6);
    const infos = await imgs.evaluateAll((els) =>
      els.map((el) => {
        const img = el as HTMLImageElement;
        img.loading = "eager";
        return { srcset: img.srcset, w: img.getBoundingClientRect().width };
      }),
    );
    for (const info of infos) {
      const widths = srcsetWidths(info.srcset);
      expect(widths.length, info.srcset).toBeGreaterThanOrEqual(2);
      expect(
        Math.max(...widths),
        `${info.srcset} @ ${info.w}`,
      ).toBeGreaterThanOrEqual(info.w * 2);
    }
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);
    const picked = await imgs.evaluateAll((els) =>
      els.map((el) => {
        const img = el as HTMLImageElement;
        const m = img.srcset
          .split(",")
          .map((c) => c.trim().split(/\s+/))
          .find(([url]) => img.currentSrc.endsWith(url.split("/").pop()!));
        return {
          w: Number(m?.[1]?.replace("w", "") ?? 0),
          css: img.getBoundingClientRect().width,
          loaded: img.complete && img.naturalWidth > 0,
        };
      }),
    );
    for (const p of picked.filter((x) => x.loaded)) {
      expect(sharpEnough(p.w, p.css, 2), JSON.stringify(p)).toBe(true);
    }
    await context.close();
  });

  for (const [name, w, h] of [
    ["d1440", 1440, 900],
    ["m390", 390, 844],
  ] as const) {
    test(`${lang} ${name}: chapter titles are h3-scale and the page is shorter`, async ({
      browser,
    }) => {
      const context = await ctx(browser, w, h, 1);
      const page = await context.newPage();
      await page.goto(`/${lang}/products/sotro/`);
      const size = (selector: string) =>
        page
          .locator(selector)
          .first()
          .evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
      const h1 = await size("h1[data-product-profile-title]");
      const titles = await page
        .locator(".story__title")
        .evaluateAll((els) =>
          els.map((el) => parseFloat(getComputedStyle(el).fontSize)),
        );
      expect(titles.length).toBeGreaterThanOrEqual(6);
      for (const t of titles)
        expect(smallerThan(t, h1), `${t} vs ${h1}`).toBe(true);

      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 600) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 40));
        }
        window.scrollTo(0, 0);
      });
      await page.waitForTimeout(300);
      // MAIN_HEIGHT predates the Owner-approved U10 interim note, which adds
      // content outside the chapters; exclude its box so this guard keeps
      // measuring the chapter layout only. The app-access status line is
      // likewise lifecycle copy (Preview wraps it to two lines at 390px), so
      // it is excluded here and from the baseline via MAIN_ACCESS.
      const height = await page.evaluate(() => {
        const excluded = [
          ...document.querySelectorAll<HTMLElement>("[data-app-access]"),
        ].reduce(
          (sum, el) =>
            sum +
            el.getBoundingClientRect().height +
            parseFloat(getComputedStyle(el).marginTop),
          0,
        );
        // EX-01 (2026-10-23): below 1024 px the hero poster stacks under the
        // copy as new content outside the chapters (capped at 60vh); it is
        // excluded like the status line so this guard keeps measuring the
        // chapter layout. Beside the copy (wide) it adds no height.
        const stage = document.querySelector<HTMLElement>(
          "[data-hero-art-stage]",
        );
        const copy = document.querySelector<HTMLElement>(".phero__copy");
        const stacked =
          stage && copy
            ? stage.getBoundingClientRect().top >=
              copy.getBoundingClientRect().bottom - 1
            : false;
        const poster =
          stage && stacked
            ? stage.getBoundingClientRect().height +
              parseFloat(
                getComputedStyle(stage.parentElement as Element).rowGap,
              )
            : 0;
        // ACQ-05 (Owner 2026-10-20) restored the 16 px gap between the
        // "What it does" H2 and its list; that list sits outside the
        // chapters, so its top margin is excluded the same way.
        const does = document.querySelector<HTMLElement>("[data-what-it-does]");
        const doesGap = does ? parseFloat(getComputedStyle(does).marginTop) : 0;
        // IX-03 (2026-10-23): the journal link section is new content outside
        // the chapters, excluded like the status line.
        const journal = document.querySelector<HTMLElement>(
          "[data-product-journal]",
        );
        const journalBox = journal
          ? journal.getBoundingClientRect().height +
            parseFloat(getComputedStyle(journal).marginTop)
          : 0;
        // 2026-11-23: the maker section (Owner decision) is new content
        // outside the chapters, excluded like the journal link.
        const maker = document.querySelector<HTMLElement>(
          "[data-product-maker]",
        );
        const makerBox = maker
          ? maker.getBoundingClientRect().height +
            parseFloat(getComputedStyle(maker).marginTop)
          : 0;
        return (
          document.documentElement.scrollHeight -
          excluded -
          doesGap -
          poster -
          journalBox -
          makerBox
        );
      });
      const before = MAIN_HEIGHT[name][lang] - MAIN_ACCESS[name];
      // Wide: tighter chapters save about 7% in the static layout (8% with
      // the sticky stage, below); phones are already one phone per chapter,
      // so they must simply not grow.
      const gain = name === "d1440" ? 0.05 : 0;
      expect(shorter(height, before, gain), `${height} vs main ${before}`).toBe(
        true,
      );
      await context.close();
    });
  }
}
