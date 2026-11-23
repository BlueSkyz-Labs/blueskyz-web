import { expect, test } from "@playwright/test";

/**
 * CX audit M4: the sample-data capture links open bare .webp files in a new
 * tab. They must say "larger image (sample data)", keep the sample-data
 * disclosure, carry rel noopener, and name the new-tab behaviour.
 */
const LABEL = {
  en: /^View larger image \(sample data\)/,
  vi: /^Xem ảnh lớn \(dữ liệu mẫu\)/,
  zh: /^查看大图（示例数据）/,
  "zh-hant": /^查看大圖（範例資料）/,
} as const;
const OPENS = {
  en: /new tab/,
  vi: /thẻ mới/,
  zh: /新标签页/,
  "zh-hant": /新分頁/,
} as const;
const OLD = /View original sample-data|Xem ảnh gốc|查看原始/;

for (const lang of ["en", "vi", "zh", "zh-hant"] as const) {
  test(`${lang}: capture links are labelled, safe and say they open the image (no JS)`, async ({
    browser,
  }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto(`/${lang}/products/sotro/`);
    const links = page.locator("a[data-capture-inspect]");
    const n = await links.count();
    expect(n).toBeGreaterThanOrEqual(10);
    for (let i = 0; i < n; i++) {
      const a = links.nth(i);
      const text = ((await a.textContent()) ?? "").trim();
      expect(text).toMatch(LABEL[lang]);
      expect(text).not.toMatch(OLD);
      const rel = (await a.getAttribute("rel")) ?? "";
      expect(rel.split(/\s+/)).toContain("noopener");
      await expect(a).toHaveAttribute("target", "_blank");
      const name = (await a.getAttribute("aria-label")) ?? "";
      expect(name).toMatch(LABEL[lang]);
      expect(name).toMatch(OPENS[lang]);
      expect(await a.getAttribute("href")).toMatch(/\.webp$/);
    }
    await expect(page.locator("[data-showcase-disclosure]")).toContainText(
      /sample|mẫu|示例|範例/i,
    );
    await ctx.close();
  });

  test(`${lang}: with JS the viewer-wired links drop the new-tab suffix and declare a dialog`, async ({
    page,
  }) => {
    await page.goto(`/${lang}/products/sotro/`);
    await page.waitForFunction(() =>
      document.documentElement.hasAttribute("data-capture-viewer-ready"),
    );
    const links = page.locator("a[data-capture-inspect]");
    const n = await links.count();
    expect(n).toBeGreaterThanOrEqual(10);
    for (let i = 0; i < n; i++) {
      const a = links.nth(i);
      const name = (await a.getAttribute("aria-label")) ?? "";
      expect(name).toMatch(LABEL[lang]);
      expect(name).not.toMatch(OPENS[lang]);
      expect(name).toBe(await a.getAttribute("data-viewer-label"));
      await expect(a).toHaveAttribute("aria-haspopup", "dialog");
    }
  });
}

test("negative proof: the matcher rejects the old label and a missing noopener", async () => {
  expect("Xem ảnh gốc (dữ liệu mẫu)").toMatch(OLD);
  expect("Xem ảnh gốc (dữ liệu mẫu)").not.toMatch(LABEL.vi);
  expect("noreferrer".split(/\s+/)).not.toContain("noopener");
});

test("negative proof: a link the script did not wire keeps the new-tab label", async ({
  page,
}) => {
  await page.goto("/en/products/sotro/");
  await page.waitForFunction(() =>
    document.documentElement.hasAttribute("data-capture-viewer-ready"),
  );
  const unwired = page.locator("#unwired");
  await page.evaluate(() => {
    const a = document.createElement("a");
    a.id = "unwired";
    a.href = "/x.webp";
    a.setAttribute("data-capture-inspect", "");
    a.setAttribute("aria-label", "View larger image (opens in a new tab)");
    document.body.prepend(a);
  });
  await expect(unwired).toHaveAttribute("aria-label", OPENS_EN_NEG);
  await expect(unwired).not.toHaveAttribute("aria-haspopup", "dialog");
});
const OPENS_EN_NEG = /new tab/;
