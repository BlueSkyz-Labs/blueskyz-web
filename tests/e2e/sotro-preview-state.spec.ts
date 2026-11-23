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
  en: "Now open: YENLUME, a rent ledger for people who rent out rooms and homes. In development: Sổ Tâm, a private journal.",
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
