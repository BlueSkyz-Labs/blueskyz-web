import { expect, test } from "@playwright/test";

// Owner 2026-09-28: Sổ Trọ and Sổ Tâm only; native apps in development.
const PUBLISHED = ["sotro", "sotam"];
const SIGN_IN: Record<string, string> = {
  sotro: "https://sotro.blueskyzlabs.com/login",
  sotam: "https://sotam.blueskyzlabs.com/auth/login",
};
const HIDDEN = ["apexagent", "fluentarc"];
// Owner 2026-10-24 publishes Vững Tay Lái at In development. Its Product Truth
// keeps public launch BLOCKED, so the page links nowhere into the running app.
// Owner 2026-10-25: its Android and iOS apps are on the roadmap, so appAccess
// lists them as "in development" only: never available, never linked.
const NO_APP_ACCESS = "vungtaylai";
const APP_HOST = "vungtaylai.blueskyzlabs.com";
const IN_DEVELOPMENT: Record<string, string> = {
  en: "In development",
  vi: "Đang phát triển",
};
// Owner 2026-11-23: YENLUME's web app is open to everyone; Sổ Tâm is not.
const WEB_LINE: Record<string, [string, string]> = {
  sotro: ["open", "Web: đã mở cho mọi người"],
  sotam: ["in-development", "Web: đang phát triển"],
};

test.describe("app access", () => {
  for (const slug of PUBLISHED) {
    test(`${slug}: one Availability line (no store link) and no sign-in link`, async ({
      page,
    }) => {
      await page.goto(`/vi/products/${slug}/`);
      // v8 W3: Access + Platforms + Stage collapse into one line; an
      // in-development native app is plain text and is never linked.
      const block = page.locator("[data-app-access]");
      await expect(block).toHaveCount(1);
      // G6 (Owner 2026-10-20): the store clause is gone. EX-01: the contact
      // link is the hero's secondary button, not part of this line.
      await expect(block).toContainText("Android và iOS: đang phát triển.");
      await expect(block).not.toContainText("chưa có bản trên cửa hàng");
      const [state, line] = WEB_LINE[slug]!;
      await expect(block).toContainText(line);
      await expect(block.locator("[data-web-state]")).toHaveAttribute(
        "data-web-state",
        state,
      );
      // The line carries no link at all (no store link, no contact link); the
      // contact action is the one secondary button beside the primary action.
      await expect(block.locator("a")).toHaveCount(0);
      await expect(page.locator("a[data-product-contact]")).toHaveAttribute(
        "href",
        "/vi/contact/",
      );
      await expect(block.locator("[data-mobile-app]")).toHaveCount(0);
      await expect(
        block.locator('[data-mobile-state="in-development"]'),
      ).toHaveCount(1);
      // Owner 2026-10-12: the public profile shows no app sign-in.
      await expect(page.locator("[data-app-signin]")).toHaveCount(0);
      await expect(page.locator(`a[href="${SIGN_IN[slug]}"]`)).toHaveCount(0);
    });
  }

  for (const lang of ["en", "vi", "zh", "zh-hant"]) {
    for (const slug of PUBLISHED) {
      test(`${lang}/${slug}: no page links to the app sign-in`, async ({
        page,
      }) => {
        for (const path of [
          `/${lang}/products/${slug}/`,
          `/${lang}/contact/`,
        ]) {
          await page.goto(path);
          await expect(page.locator(`a[href="${SIGN_IN[slug]}"]`)).toHaveCount(
            0,
          );
        }
      });
    }
  }

  for (const lang of ["en", "vi"]) {
    test(`${lang}/${NO_APP_ACCESS}: In development, no store badge, no sign-in or app link`, async ({
      page,
    }) => {
      await page.goto(`/${lang}/products/${NO_APP_ACCESS}/`);
      await expect(page.locator("main")).toContainText(IN_DEVELOPMENT[lang]!);
      await expect(page.locator("[data-app-signin]")).toHaveCount(0);
      await expect(page.locator("[data-mobile-app]")).toHaveCount(0);
      await expect(
        page.locator('[data-app-access] [data-mobile-state="in-development"]'),
      ).toHaveCount(1);
      await expect(
        page.locator(
          '[data-mobile-state]:not([data-mobile-state="in-development"])',
        ),
      ).toHaveCount(0);
      await expect(
        page.locator(
          'a[href*="play.google.com"], a[href*="apps.apple.com"], a[href*="itunes.apple.com"]',
        ),
      ).toHaveCount(0);
      await expect(page.locator(`a[href*="${APP_HOST}"]`)).toHaveCount(0);
    });
  }

  test("hidden products have no profile page and are not listed", async ({
    page,
  }) => {
    await page.goto("/en/products/");
    for (const slug of HIDDEN) {
      await expect(page.locator(`a[href*="/products/${slug}/"]`)).toHaveCount(
        0,
      );
      const response = await page.request.get(`/en/products/${slug}/`);
      expect(response.status()).toBe(404);
    }
  });
});
