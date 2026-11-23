import { expect, test } from "@playwright/test";
import { webPreviewOpen } from "../../src/components/product/product-page-copy";

/**
 * Preview 2026-10-15: Sổ Trọ's web app is open as a preview (lifecycle beta,
 * availability preview, label "Preview"); Sổ Tâm stays in development. Every
 * preview surface derives from the registry through `webPreviewOpen`, and a
 * product that is not open keeps the closed wording.
 */
const LANGS = ["en", "vi", "zh", "zh-hant"] as const;

const HOME_LINE = {
  en: "Now open: YENLUME, a rent ledger for landlords. In development: Sổ Tâm, a private journal.",
  vi: "Đã mở: YENLUME, cuốn sổ thu tiền cho người có nhà cho thuê. Đang phát triển: Sổ Tâm, cuốn nhật ký của riêng bạn.",
  zh: "已开放：YENLUME，给房东用的收租账本。开发中：Sổ Tâm，只属于你的私密日记。",
  "zh-hant":
    "已開放：YENLUME，給房東用的收租帳本。開發中：Sổ Tâm，只屬於你的私密日記。",
} as const;

const OPEN_LABEL = {
  en: "open to everyone",
  vi: "đã mở cho mọi người",
  zh: "已开放使用",
  "zh-hant": "已開放使用",
} as const;
const PREVIEW_LABEL = {
  en: "open preview, limited places",
  vi: "bản xem trước đã mở, số chỗ có hạn",
  zh: "预览版已开放，名额有限",
  "zh-hant": "預覽版已開放，名額有限",
} as const;

test("negative proof: webPreviewOpen needs web, an early-or-later lifecycle and a listing", () => {
  const base = {
    platforms: ["web"],
    lifecycle: "beta",
    availability: "preview",
  };
  // The cast keeps the probe to the three fields the predicate reads.
  const open = (over: Record<string, unknown>) =>
    webPreviewOpen({ ...base, ...over } as never);
  expect(open({})).toBe(true);
  expect(open({ lifecycle: "development" })).toBe(false);
  expect(open({ availability: "private" })).toBe(false);
  expect(open({ platforms: ["android"] })).toBe(false);
});

for (const lang of LANGS) {
  test(`${lang}: Sổ Trọ shows the open web preview, Sổ Tâm stays closed`, async ({
    page,
  }) => {
    await page.goto(`/${lang}/products/sotro/`);
    await expect(page.locator("[data-web-state]")).toHaveAttribute(
      "data-web-state",
      "open",
    );
    // Public availability: the line says "open to everyone" and never the
    // preview wording (Lead bug 2026-11-23).
    const line = page.locator("[data-app-access]");
    await expect(line).toContainText(OPEN_LABEL[lang]);
    await expect(line).not.toContainText(PREVIEW_LABEL[lang]);
    await expect(page.locator("[data-interim-note]")).toHaveAttribute(
      "data-interim-state",
      "web-preview",
    );
    // Public launch (Owner 2026-11-22): publicSignup opens exactly one link to
    // the app origin, the primary action. No separate sign-in link (#575).
    await expect(
      page.locator('main a[href*="yenlume.blueskyzlabs.com"]'),
    ).toHaveCount(1);
    await expect(page.locator("[data-app-signin]")).toHaveCount(0);

    await page.goto(`/${lang}/products/sotam/`);
    await expect(page.locator("[data-web-state]")).toHaveAttribute(
      "data-web-state",
      "in-development",
    );
    await expect(page.locator("[data-interim-note]")).toHaveAttribute(
      "data-interim-state",
      "closed",
    );
  });

  test(`${lang}: home names YENLUME as open and Sổ Tâm in development`, async ({
    page,
  }) => {
    await page.goto(`/${lang}/`);
    await expect(page.locator("main")).toContainText(HOME_LINE[lang]);
  });
}

// Open product: captures are described as taken under the old name; the
// other products keep the development-build wording (Lead 2026-11-23).
const SHOWCASE_NOTE = {
  en: "when the product was still named Sổ Trọ. Sample data only",
  vi: "khi sản phẩm còn tên Sổ Trọ. Chỉ dùng dữ liệu mẫu",
  zh: "当时产品名为 Sổ Trọ。仅使用示例数据",
  "zh-hant": "當時產品名為 Sổ Trọ。僅使用範例資料",
} as const;
const OLD_SHOWCASE = {
  en: "Screens from the development build",
  vi: "Giao diện của bản đang phát triển",
  zh: "开发版本的界面",
  "zh-hant": "開發版本的畫面",
} as const;
const GUIDE_STATUS = {
  en: "Steps may change in later updates.",
  vi: "Các bước có thể thay đổi ở những bản cập nhật sau.",
  zh: "步骤可能会在后续更新中调整。",
  "zh-hant": "步驟可能會在後續更新中調整。",
} as const;
const GUIDE_NOTE = {
  en: "when the product was still named Sổ Trọ.",
  vi: "khi sản phẩm còn tên Sổ Trọ.",
  zh: "当时产品名为 Sổ Trọ。",
  "zh-hant": "當時產品名為 Sổ Trọ。",
} as const;
const OLD_GUIDE_STATUS = /Preview\.|Bản xem trước|预览版|預覽版/;

for (const lang of LANGS) {
  test(`${lang}: YENLUME screens and guide say the captures predate the rename`, async ({
    page,
  }) => {
    await page.goto(`/${lang}/products/sotro/`);
    const note = page.locator("[data-showcase-disclosure]").first();
    await expect(note).toContainText(SHOWCASE_NOTE[lang]);
    await expect(note).not.toContainText(OLD_SHOWCASE[lang]);

    await page.goto(`/${lang}/products/sotro/guide/`);
    const status = page.locator(".guide__status");
    await expect(status).toHaveText(GUIDE_STATUS[lang]);
    await expect(status).not.toContainText(OLD_GUIDE_STATUS);
    await expect(page.locator(".guide__disclosure")).toContainText(
      GUIDE_NOTE[lang],
    );

    // Sổ Tâm is still in development: its wording does not change.
    await page.goto(`/${lang}/products/sotam/`);
    await expect(
      page.locator("[data-showcase-disclosure]").first(),
    ).toContainText(OLD_SHOWCASE[lang]);
  });
}
