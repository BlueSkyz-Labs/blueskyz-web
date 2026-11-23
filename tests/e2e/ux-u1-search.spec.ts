import { expect, test } from "@playwright/test";

// U1 / red-team C-01: header search must not give confident wrong answers and
// must not dead-end. Desktop trigger pinned so projects behave identically.
test.use({ viewport: { width: 1280, height: 800 } });

// Preview 2026-10-15: the status line names each product's own state from the
// registry, so an open product is never called "in development".
const STATUS: Record<string, RegExp> = {
  en: /^YENLUME: open to everyone; Sổ Tâm: in development; Vững Tay Lái: in development; Android and iOS: no store release\.$/,
  vi: /^YENLUME: đã mở cho mọi người; Sổ Tâm: đang phát triển; Vững Tay Lái: đang phát triển; Android và iOS: chưa có bản trên cửa hàng ứng dụng\.$/,
  zh: /^YENLUME：已开放使用；Sổ Tâm：开发中；Vững Tay Lái：开发中；Android 与 iOS：尚未上架应用商店\.$/,
  "zh-hant":
    /^YENLUME：已開放使用；Sổ Tâm：開發中；Vững Tay Lái：開發中；Android 與 iOS：尚未上架應用程式商店\.$/,
};

async function search(
  page: import("@playwright/test").Page,
  lang: string,
  q: string,
) {
  await page.goto(`/${lang}/`);
  await page.keyboard.press("Control+k");
  await page.locator("[data-command-input]").fill(q);
}

const items = (page: import("@playwright/test").Page) =>
  page.locator("[data-command-item]:not([hidden])");

test("vi 'giá' no longer matches Privacy or cookie text", async ({ page }) => {
  await search(page, "vi", "giá");
  await expect(items(page)).toHaveCount(0);
  await expect(page.locator("[data-command-empty]")).toBeVisible();
  await expect(
    page.locator(
      "dialog[data-command-navigator] [data-command-list] a:visible",
    ),
  ).toHaveCount(0);
});

test("unaccented 'gia' does not match inside longer words", async ({
  page,
}) => {
  // 'gia' (unaccented) must not match inside 'giao diện'-style words either.
  await search(page, "vi", "gia");
  for (const item of await items(page).all()) {
    await expect(item).not.toContainText(/quyền riêng tư|bằng chứng/i);
  }
});

for (const [lang, queries] of [
  ["en", ["price", "pricing", "sign up", "zzqx"]],
  ["vi", ["giá", "tải app", "đăng ký", "zzqx", "download"]],
] as const) {
  for (const q of queries) {
    test(`${lang} '${q}' shows fallback links${q === "zzqx" ? " and no status line" : ""}`, async ({
      page,
    }) => {
      await search(page, lang, q);
      await expect(items(page)).toHaveCount(0);
      const fallback = page.locator("[data-command-fallback]");
      await expect(fallback).toBeVisible();
      await expect(
        fallback.locator(`a[href="/${lang}/products/"]`),
      ).toBeVisible();
      await expect(
        fallback.locator(`a[href="/${lang}/contact/"]`),
      ).toBeVisible();
      const status = page.locator("[data-command-status]");
      if (q === "zzqx") {
        // No hit and no status intent: fallback links only, no availability claim.
        await expect(status).toBeHidden();
      } else {
        await expect(status).toBeVisible();
        await expect(status).toHaveText(STATUS[lang]!);
      }
    });
  }
}

// ACQ-02 (wave 1c): a word that the product profile itself publishes now finds
// the product instead of the fallback. 'zalo' (a receipt channel) is such a
// word; the no-hit, no-status case is pinned above with 'zzqx'.
for (const lang of ["en", "vi"] as const) {
  test(`${lang} 'zalo' finds YENLUME from its published text`, async ({
    page,
  }) => {
    await search(page, lang, "zalo");
    await expect(items(page).first()).toContainText("YENLUME");
    await expect(page.locator("[data-command-fallback]")).toBeHidden();
    await expect(page.locator("[data-command-status]")).toBeHidden();
  });
}

// A status-intent word keeps the honest availability line even when the query
// also finds a product: EN 'download' matches the published "spreadsheet to
// download" capability, but the visitor asking to download the app must still
// read "no store release".
test("en 'download' finds YENLUME and keeps the status line", async ({
  page,
}) => {
  await search(page, "en", "download");
  await expect(items(page).first()).toContainText("YENLUME");
  const status = page.locator("[data-command-status]");
  await expect(status).toBeVisible();
  await expect(status).toHaveText(STATUS.en!);
});

test("negative proof: results without a status-intent word show no status line", async ({
  page,
}) => {
  await search(page, "en", "rent");
  await expect(items(page).first()).toContainText("YENLUME");
  await expect(page.locator("[data-command-status]")).toBeHidden();
});

// Search must distinguish a genuinely empty query from punctuation/emoji.
// Both tokenize to zero words, but a non-empty input must never imply matches.
for (const lang of ["en", "vi", "zh", "zh-hant"] as const) {
  for (const query of ["???", "🧩"]) {
    test(`${lang}: non-word query ${query} never returns the full index`, async ({
      page,
    }) => {
      await search(page, lang, query);
      await expect(items(page)).toHaveCount(0);
      await expect(page.locator("[data-command-empty]")).toBeVisible();
      await expect(page.locator("[data-command-fallback]")).toBeVisible();
      await expect(page.locator("[data-command-status]")).toBeHidden();
      await expect(page.locator("[data-command-live]")).toHaveText(/\S+/);
    });
  }
}

test("negative control: a genuinely blank query still lists destinations", async ({
  page,
}) => {
  await search(page, "en", "   ");
  expect(await items(page).count()).toBeGreaterThan(0);
  await expect(page.locator("[data-command-fallback]")).toBeHidden();
  await expect(page.locator("[data-command-empty]")).toBeHidden();
});

test("status line exists for all four locales on a price intent", async ({
  page,
}) => {
  const q = { en: "price", vi: "giá", zh: "价格", "zh-hant": "價格" } as const;
  for (const lang of ["en", "vi", "zh", "zh-hant"] as const) {
    await search(page, lang, q[lang]);
    await expect(page.locator("[data-command-status]")).toHaveText(
      STATUS[lang]!,
    );
    await expect(
      page.locator(`[data-command-fallback] a[href="/${lang}/contact/"]`),
    ).toBeVisible();
  }
});

test("negative proof: a matching query hides the fallback and status", async ({
  page,
}) => {
  await search(page, "en", "privacy");
  await expect(items(page)).toHaveCount(1);
  await expect(page.locator("[data-command-fallback]")).toBeHidden();
  await expect(page.locator("[data-command-status]")).toBeHidden();
});

test("title hits rank above body hits", async ({ page }) => {
  await search(page, "en", "contact");
  const first = items(page).first();
  await expect(first).toContainText("Contact");
});
