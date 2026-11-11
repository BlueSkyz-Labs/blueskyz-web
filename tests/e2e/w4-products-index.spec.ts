// v8 W4: products index. One card per product with a thumbnail, the status
// badge once, no intent chips, and "How we verify" folded into Next steps.
import { expect, test } from "@playwright/test";

const LOCALES = ["en", "vi", "zh", "zh-hant"] as const;
const SOTRO_CUSTOMER_OUTCOME = {
  en: "For landlords in Vietnam: see what is still unpaid this month and what needs doing today.",
  vi: "Dành cho chủ trọ ở Việt Nam: xem tháng này còn ai chưa đóng tiền và hôm nay cần lo việc gì.",
  zh: "给越南房东：查看本月还有谁没交租、今天要处理什么。",
  "zh-hant": "給越南房東：查看本月還有誰沒繳租、今天要處理什麼。",
} as const;

for (const lang of LOCALES) {
  test(`/${lang}/products/ has no intent control and one badge per card`, async ({
    page,
  }) => {
    await page.goto(`/${lang}/products/`);
    // Negative proof target: the "What brings you here?" chips are gone.
    await expect(page.locator("[data-intent-control]")).toHaveCount(0);
    await expect(page.locator("button[data-intent]")).toHaveCount(0);
    await expect(page.locator("[data-verify-link]")).toHaveCount(0);

    const cards = page.locator("[data-product-card]");
    // Owner 2026-10-24 adds Vững Tay Lái (In development) as the third card.
    await expect(cards).toHaveCount(3);
    for (let i = 0; i < 3; i += 1) {
      const card = cards.nth(i);
      await expect(card.locator("[data-product-thumb]")).toHaveCount(1);
      await expect(card.locator("[data-product-status]")).toHaveCount(1);
    }

    const sotro = cards.filter({ hasText: "Sổ Trọ" });
    await expect(sotro.locator(".product-card__body p")).toHaveText(
      SOTRO_CUSTOMER_OUTCOME[lang],
    );
    // The section heading must not repeat the badge label visibly.
    await expect(page.locator("#published-products")).toHaveClass(/sr-only/);

    // How we verify lives in the Next-steps row, once.
    await expect(
      page.locator(`[data-journey-bar] a[href="/${lang}/verify/"]`),
    ).toHaveCount(1);
  });
}

test("Sổ Trọ shows its real capture, Sổ Tâm the icon composition", async ({
  page,
}) => {
  await page.goto("/en/products/");
  const sotro = page
    .locator("[data-product-card]")
    .filter({ hasText: "Sổ Trọ" });
  await expect(sotro.locator("[data-product-thumb]")).toHaveAttribute(
    "data-product-thumb",
    "capture",
  );
  await expect(sotro.locator("[data-product-thumb] img")).toHaveAttribute(
    "src",
    /\/products\/sotro\/showcase\/.+\.webp$/,
  );
  const sotam = page
    .locator("[data-product-card]")
    .filter({ hasText: "Sổ Tâm" });
  await expect(sotam.locator("[data-product-thumb]")).toHaveAttribute(
    "data-product-thumb",
    "icon",
  );
  await expect(sotro.locator("[data-product-cta]")).toContainText("See Sổ Trọ");
  await expect(sotam.locator("[data-product-cta]")).toContainText("See Sổ Tâm");
});

test("lede is the short deck line and nothing overflows at 390px", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/en/products/");
  await expect(
    page.getByText(
      "Each product says plainly what stage it is at, what works now and what is still planned.",
    ),
  ).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});
