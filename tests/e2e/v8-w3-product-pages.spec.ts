import { expect, test } from "@playwright/test";

/**
 * v8 W3: product pages read as a story. Measured in the rendered pages; the
 * pure predicates are proven to fail on a broken input (negative proof).
 */
const LOCALES = ["en", "vi", "zh", "zh-hant"] as const;
const STORE_CTA = /google play|app store|get it on|tải trên|下载于|下載於/i;

/** Rendered page height budget at 1440 px for Sổ Trọ, outside the Feature
 * Story. v12 S1 (Owner 2026-10-04: the showcase was too thin) adds the story
 * on purpose; its scroll runway has its own cap so the page stays a story,
 * not a data sheet: at most one viewport per chapter plus 1.5 for the coda. */
export const MAX_SOTRO_HEIGHT = 5000;
const withinHeight = (height: number) => height <= MAX_SOTRO_HEIGHT;
export const storyRunwayFits = (
  story: number,
  chapters: number,
  viewport: number,
) => chapters > 0 && story <= (chapters + 1.5) * viewport;
/** v12 S1 amendment (orchestrator, 2026-10-04): absolute total page cap. */
export const totalHeightFits = (
  height: number,
  chapters: number,
  viewport: number,
) => chapters > 0 && height <= MAX_SOTRO_HEIGHT + (chapters + 1.5) * viewport;
const hasStoreCta = (text: string, anchors: number) =>
  anchors > 0 || STORE_CTA.test(text);

test("negative proof: the height and store-CTA predicates can fail", () => {
  expect(withinHeight(5001)).toBe(false);
  expect(storyRunwayFits(6000, 5, 900)).toBe(false);
  expect(storyRunwayFits(100, 0, 900)).toBe(false);
  expect(storyRunwayFits(5850, 5, 900)).toBe(true);
  expect(totalHeightFits(10851, 5, 900)).toBe(false);
  expect(totalHeightFits(100, 0, 900)).toBe(false);
  expect(totalHeightFits(10850, 5, 900)).toBe(true);
  expect(hasStoreCta("Android: Get it on Google Play", 0)).toBe(true);
  expect(hasStoreCta("Android and iOS: in development", 1)).toBe(true);
});

for (const lang of LOCALES) {
  test.describe(lang, () => {
    // Sổ Tâm gained real screens (#698), so it now has the same single
    // primary action as Sổ Trọ: an in-page anchor, never an app link.
    for (const slug of ["sotro", "sotam"]) {
      test(`${slug} has exactly one primary action, anchored to the screens`, async ({
        page,
      }) => {
        await page.goto(`/${lang}/products/${slug}/`);
        const primary = page.locator("[data-primary-action]");
        await expect(primary).toHaveCount(1);
        // Sổ Trọ opened public sign-up (Owner 2026-11-22): its primary action
        // opens the app origin. Sổ Tâm keeps the in-page anchor.
        await expect(primary).toHaveAttribute(
          "href",
          slug === "sotro"
            ? "https://sotro.blueskyzlabs.com/"
            : "#profile-showcase",
        );
        await expect(page.locator("#profile-showcase")).toHaveCount(1);
        // Owner 2026-10-12: no public app sign-in link.
        await expect(page.locator("[data-app-signin]")).toHaveCount(0);
      });
    }

    for (const slug of ["sotro", "sotam"]) {
      test(`${slug}: one Availability line, no store CTA, no audience`, async ({
        page,
      }) => {
        await page.goto(`/${lang}/products/${slug}/`);
        const line = page.locator("[data-app-access]");
        await expect(line).toHaveCount(1);
        // G6: never a store link. EX-01: no link in the line at all; the
        // contact action is the one secondary button beside the primary one.
        await expect(line.locator("a")).toHaveCount(0);
        await expect(page.locator("a[data-product-contact]")).toHaveAttribute(
          "href",
          `/${lang}/contact/`,
        );
        const text = (await line.textContent()) ?? "";
        expect(hasStoreCta(text, 0), text).toBe(false);
        await expect(page.locator("[data-mobile-state]")).toHaveCount(1);
        await expect(page.locator("main")).not.toContainText(
          /Audience|Đối tượng|目标人群|適用對象|Professionals|Individuals/i,
        );
      });

      test(`${slug}: one What it does list of at most five items`, async ({
        page,
      }) => {
        await page.goto(`/${lang}/products/${slug}/`);
        const items = page.locator("[data-what-it-does] > li");
        const count = await items.count();
        expect(count).toBeGreaterThan(0);
        expect(count).toBeLessThanOrEqual(5);
        await expect(page.locator("h2#profile-jobs")).toHaveCount(1);
        await expect(page.locator("#profile-capabilities")).toHaveCount(0);
      });
    }

    test("Sổ Tâm shows no tagline art and no 'AI Journal for Clarity'", async ({
      page,
    }) => {
      await page.goto(`/${lang}/products/sotam/`);
      await expect(page.locator("[data-product-visual] img")).toHaveCount(0);
      await expect(page.locator("main")).not.toContainText(
        /AI Journal for Clarity/i,
      );
      await expect(page.locator("main")).not.toContainText(
        /A BlueSkyz Labs product/i,
      );
    });

    test("Sổ Trọ: the Feature Story leads; every untold screen is behind More screens", async ({
      page,
    }) => {
      // v12 S1 replaces the v8 W3 "3 phones + 1 desktop lead" pin: the story
      // (5 phone chapters + 1 desktop coda) leads, nothing else does, and each
      // of the 10 recorded screens appears exactly once.
      await page.goto(`/${lang}/products/sotro/`);
      const more = page.locator("[data-showcase-more]");
      await expect(more).toHaveCount(1);
      const lead = await page.evaluate(() => ({
        chapters: [...document.querySelectorAll("[data-story-chapter]")].map(
          (el) => el.getAttribute("data-story-chapter"),
        ),
        coda: document
          .querySelector("[data-story-coda]")
          ?.getAttribute("data-story-coda"),
        otherLead: [
          ...document.querySelectorAll(
            "[data-product-showcase] .showcase__phone, [data-product-showcase] .showcase__desktops > li",
          ),
        ].filter((el) => !el.closest("[data-showcase-more]")).length,
      }));
      expect(lead).toEqual({
        chapters: ["today", "utilities", "collect", "rooms", "candlelight"],
        coda: "owner-collect",
        otherLead: 0,
      });
      expect(await more.getAttribute("open")).toBeNull();
      await expect(
        more.locator(".showcase__phone, .showcase__desktops > li"),
      ).toHaveCount(4);
      const srcs = await page
        .locator("[data-product-showcase] img")
        .evaluateAll((els) =>
          els.map((el) => (el as HTMLImageElement).getAttribute("src")),
        );
      expect(new Set(srcs).size).toBe(10);
      expect(srcs.length).toBe(10);
      await page.locator("[data-showcase-more] > summary").click();
      await expect(more).toHaveAttribute("open", "");
    });

    test("website privacy scope is accessible; security and support remain available", async ({
      page,
    }) => {
      await page.goto(`/${lang}/products/sotro/`);
      const trust = page.locator("[data-profile-trust]");
      await expect(trust).toHaveCount(1);
      await expect(trust.locator("a")).toHaveCount(3);
      await expect(trust.locator("svg")).toHaveCount(0);
      const trustHrefs = await trust
        .locator("a")
        .evaluateAll((links) =>
          links.map((link) => (link as HTMLAnchorElement).getAttribute("href")),
        );
      expect(trustHrefs).toEqual([
        `/${lang}/privacy/`,
        `/${lang}/security/`,
        `/${lang}/support/`,
      ]);
      const privacyLabel = {
        en: "Website privacy",
        vi: "Quyền riêng tư website",
        zh: "网站隐私",
        "zh-hant": "網站隱私權",
      }[lang];
      await expect(
        trust.getByRole("link", { name: privacyLabel }),
      ).toHaveAttribute("aria-describedby", "product-privacy-scope");
      const scope = page.locator("[data-product-privacy-scope]");
      await expect(scope).toHaveClass(/\bsr-only\b/);
    });
  });
}

for (const reducedMotion of ["no-preference", "reduce"] as const) {
  test(`Sổ Trọ height at 1440: total, outside-the-story and story runway caps (${reducedMotion})`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/en/products/sotro/");
    await page.locator("[data-showcase-more]").waitFor();
    const { height, story, chapters } = await page.evaluate(async () => {
      const el = document.querySelector<HTMLElement>("[data-feature-story]")!;
      // Render the section (content-visibility) before measuring it.
      el.scrollIntoView();
      for (let y = 0; y < el.offsetHeight + innerHeight; y += 400) {
        window.scrollBy(0, 400);
        await new Promise((resolve) => setTimeout(resolve, 30));
      }
      return {
        height: document.documentElement.scrollHeight,
        story: el.getBoundingClientRect().height,
        chapters: el.querySelectorAll("[data-story-chapter]").length,
      };
    });
    expect(
      withinHeight(height - story),
      `height ${height} - story ${story}`,
    ).toBe(true);
    expect(
      storyRunwayFits(story, chapters, 900),
      `story ${story}, ${chapters} chapters`,
    ).toBe(true);
    expect(
      totalHeightFits(height, chapters, 900),
      `total ${height}, ${chapters} chapters`,
    ).toBe(true);
  });
}

test("no profile renders the endorsed lockup; the app icon carries the brand (BB-03)", async ({
  page,
}) => {
  for (const lang of LOCALES) {
    for (const slug of ["sotro", "sotam"]) {
      for (const width of [390, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(`/${lang}/products/${slug}/`);
        await expect(
          page.locator(".profile-lockup"),
          `${lang}/${slug} @${width}`,
        ).toHaveCount(0);
        await expect(
          page.locator(`header img[src*="${slug}"]`).first(),
          `${lang}/${slug} icon @${width}`,
        ).toBeVisible();
      }
    }
  }
  // Negative proof: the selector counts a lockup when one is present.
  await page.setContent(`<div class="profile-lockup"><img alt="" /></div>`);
  await expect(page.locator(".profile-lockup")).toHaveCount(1);
});
