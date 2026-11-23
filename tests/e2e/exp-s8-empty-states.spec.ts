import { readdirSync, readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

/** Public product slugs, split by whether a showcase (real captures) exists. */
const PUBLIC_SLUGS = readdirSync("src/content/products")
  .filter((f) => f.endsWith(".yaml"))
  .map((f) => readFileSync(`src/content/products/${f}`, "utf8"))
  .filter((src) => /^public:\s*true\s*$/m.test(src))
  .map((src) => src.match(/^slug:\s*(\S+)/m)![1]);
const SHOWCASED = new Set(
  readdirSync("src/content/showcases")
    .filter((f) => f.endsWith(".yaml"))
    .map(
      (f) =>
        readFileSync(`src/content/showcases/${f}`, "utf8").match(
          /^product:\s*(\S+)/m,
        )![1],
    ),
);

const LOCALES = ["en", "vi", "zh", "zh-hant"] as const;
const FOUNDER_TITLE: Record<(typeof LOCALES)[number], string> = {
  en: "Founder & CEO",
  vi: "Nhà sáng lập kiêm CEO",
  zh: "创始人兼首席执行官",
  "zh-hant": "創辦人兼執行長",
};
const MISSION = {
  en: /We build intelligent products that empower people and elevate the way work gets done\./,
  vi: /Chúng\s+tôi\s+làm\s+những\s+sản\s+phẩm\s+thông\s+minh/,
  zh: /我们打造智能化产品/,
  "zh-hant": /我們打造智慧化產品/,
} as const;
const MISSION_HEADING: Record<(typeof LOCALES)[number], string> = {
  en: "Our mission",
  vi: "Điều chúng tôi theo đuổi",
  zh: "我们的使命",
  "zh-hant": "我們的使命",
};
const EMAIL =
  /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/;
const PHONE = /(?:\+\d{1,3}[ .-]?)\(?\d{1,4}\)?[ .-]\d{3}[ .-]?\d{3,4}/;
const FOUNDER = /Tony Nguyen|Founder|\bCEO\b|Nhà sáng lập|创始人|創辦人|執行長/;

const words = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

// The plan budgets are English words. Vietnamese separates every syllable with
// a space (about 1.6x the English token count) and Chinese has no spaces, so
// those locales are measured in their own unit against a scaled budget.
function size(lang: string, text: string) {
  return lang === "zh" || lang === "zh-hant"
    ? text.replace(/\s/g, "").length
    : words(text);
}
function budget(lang: string, englishWords: number) {
  if (lang === "vi") return Math.round(englishWords * 1.6);
  if (lang === "zh" || lang === "zh-hant") return englishWords * 2;
  return englishWords;
}

for (const lang of LOCALES) {
  test.describe(`S8 empty states /${lang}/`, () => {
    test("contact: owner-confirmed business mailbox and separate security reporting", async ({
      page,
    }) => {
      await page.goto(`/${lang}/contact/`);
      const main = page.locator("main");
      const text = await main.innerText();
      expect(size(lang, text), "contact visible size").toBeLessThanOrEqual(
        budget(lang, 100),
      );
      const publishedEmails = text.match(new RegExp(EMAIL.source, "g")) ?? [];
      // The business mailbox comes first; the published product-support
      // mailbox (Owner 2026-10-18, A-02) may follow as a labelled secondary row.
      const supportRow = main.locator('[data-public-email-role="support"]');
      const hasSupport = (await supportRow.count()) > 0;
      expect(publishedEmails).toHaveLength(hasSupport ? 2 : 1);
      expect(publishedEmails[0]).toMatch(/^(?:hello|tony)@blueskyzlabs\.com$/);
      if (hasSupport) {
        expect(publishedEmails[1]).toBe("support@blueskyzlabs.com");
        await expect(supportRow.locator("a")).toHaveAttribute(
          "href",
          "mailto:support@blueskyzlabs.com",
        );
        await expect(supportRow.locator(".btn--primary")).toHaveCount(0);
      }
      expect(text).not.toMatch(PHONE);
      const businessEmail = main.locator(
        '[data-public-email-role="contact"] a',
      );
      await expect(businessEmail).toHaveCount(1);
      await expect(businessEmail).toHaveAttribute(
        "href",
        /^mailto:(?:hello|tony)@blueskyzlabs\.com$/,
      );
      await expect(businessEmail).toHaveText(publishedEmails[0]);
      await expect(main.locator('a[href^="mailto:"]')).toHaveCount(
        hasSupport ? 2 : 1,
      );
      await expect(
        main.locator(
          '[data-public-email-role="privacy"], [data-public-email-role="security"]',
        ),
      ).toHaveCount(0);
      await expect(page.locator('main a[href^="tel:"]')).toHaveCount(0);
      const primary = page.locator("main [data-safe-action] a");
      await expect(primary).toHaveCount(1);
      await expect(primary).toHaveAttribute(
        "href",
        /^https:\/\/github\.com\/BlueSkyz-Labs\/blueskyz-web\/security\/advisories\/new$/,
      );
      // Owner 2026-10-12: Contact shows no product sign-in lane.
      await expect(page.locator("[data-contact-signin]")).toHaveCount(0);
      await expect(
        page.locator('[data-contact-lane="business-state"]'),
      ).toHaveCount(0);
    });

    test("about: owner-confirmed identity, mission, and registry products", async ({
      page,
    }) => {
      await page.goto(`/${lang}/about/`);
      const text = await page.locator("main").innerText();
      expect(size(lang, text), "about visible size").toBeLessThanOrEqual(
        budget(lang, 150),
      );
      const normalizedText = text.toLocaleLowerCase();
      expect(normalizedText).toContain("tony nguyen");
      expect(normalizedText).toContain(FOUNDER_TITLE[lang].toLocaleLowerCase());
      expect(text).toContain("2026");
      expect(text).toMatch(MISSION[lang]);
      await expect(page.locator("[data-about-mission] h2")).toHaveText(
        MISSION_HEADING[lang],
      );
      expect(text).toMatch(FOUNDER);
      expect(text).not.toMatch(EMAIL);
      const products = page.locator(
        "[data-about-composition] [data-about-product]",
      );
      await expect(products).toHaveCount(3);
      // Public launch 2026-11-23: YENLUME is available, Sổ Tâm in development.
      // Owner 2026-10-24 adds Vững Tay Lái, also In development.
      for (const [status, count] of [
        ["Available", 1],
        ["In development", 2],
      ] as const)
        await expect(
          page.locator(
            `[data-about-composition] [data-product-status='${status}']`,
          ),
        ).toHaveCount(count);
    });

    test("each product page shows the empty state exactly when it has no captures", async ({
      page,
    }) => {
      expect(PUBLIC_SLUGS.length).toBeGreaterThan(0);
      for (const slug of PUBLIC_SLUGS) {
        await page.goto(`/${lang}/products/${slug}/`);
        const stage = page.locator("[data-no-capture]");
        if (SHOWCASED.has(slug)) {
          // Real captures replace the empty state.
          await expect(stage).toHaveCount(0);
          continue;
        }
        await expect(stage).toHaveCount(1);
        // v8 W3 (OG-3): art with an unconfirmed tagline never renders; only the
        // status-honest line remains.
        await expect(stage.locator("img, [data-media-kind]")).toHaveCount(0);
        await expect(page.locator("[data-product-visual]")).toHaveCount(0);
        await expect(
          page.locator(".showcase__device, .showcase__phone"),
        ).toHaveCount(0);
        await expect(page.locator("[data-product-status]")).toHaveCount(1);
        // v7 D-13: the current stage only; no "next" line, no stage list.
        await expect(page.locator("[data-product-ladder]")).toHaveCount(1);
        await expect(page.locator("[data-product-ladder] strong")).toHaveCount(
          1,
        );
        await expect(page.locator("[data-product-ladder] details")).toHaveCount(
          0,
        );
        await expect(page.locator("[data-product-ladder] li")).toHaveCount(0);
        await expect(page.locator("[data-product-ladder]")).not.toContainText(
          /next in the ladder|giai đoạn kế tiếp|下一阶段|下一階段|all stages|tất cả giai đoạn/i,
        );
      }
    });
  });
}

test("negative proof: the word-count detector rejects 151 words", () => {
  expect(words(Array(151).fill("w").join(" "))).toBeGreaterThan(150);
  expect(EMAIL.test("a@b.co")).toBe(true);
  expect(FOUNDER.test("Tony Nguyen — Founder & CEO")).toBe(true);
});
