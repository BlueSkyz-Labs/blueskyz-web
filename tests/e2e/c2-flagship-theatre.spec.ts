import { expect, test, type TestInfo } from "@playwright/test";
import { startFixtureServer } from "./helpers/parity-fixture";
import { hasPublicProducts } from "./product-helpers.ts";

/**
 * C2 P3 (Task 7) — fixture-backed spec for the FlagshipTheatre component.
 *
 * Contract enforced:
 *   - The theatre is truth-driven: consumes exactly one public product record,
 *     never invents facts, and renders NOTHING (not a placeholder shell)
 *     when the record is absent.
 *   - The fixture app at tests/e2e/fixtures/parity-app provides a synthetic
 *     public record (`fixture-flagship`) so product-present behaviour is
 *     testable while the production registry remains intentionally empty.
 *   - Continuity: one `data-product-continuity="media"` element per document
 *     with a unique `view-transition-name` derived from the record slug.
 *   - Vocabulary boundary: no invented assurance language.
 */

const THEATRE = "[data-flagship-theatre]";
const TITLE = "#flagship-theatre-title";
const CONTINUITY = '[data-product-continuity="media"]';
const BANNED_ASSURANCE =
  /\b(certified|audited|guaranteed|trust score|risk score)\b/i;

function annotateAbsent(testInfo: TestInfo, route: string): void {
  testInfo.annotations.push({
    type: "theatre-absent",
    description: `${route} has no flagship theatre — the public product registry is empty, which is the legal (fail-closed) state; no placeholder or fake shell is rendered`,
  });
}

test.describe("C2 Flagship Theatre — fixture-backed (product present)", () => {
  let origin = "";
  let closeServer = () => Promise.resolve();

  test.beforeAll(async () => {
    const server = await startFixtureServer();
    origin = server.origin;
    closeServer = server.close;
  });

  test.afterAll(async () => {
    await closeServer();
  });

  for (const locale of [
    {
      lang: "en",
      path: "/product-acts/",
      profilePath: "/en/products/fixture-flagship/",
      status: "In development",
      eyebrow: "Flagship product",
      description: "Fixture description for the flagship act.",
      jobsHeading: "What it helps you do",
      jobs: ["Fixture job one", "Fixture job two"],
      scopeHeading: "What we're building",
      capabilities: [
        "Fixture capability one",
        "Fixture capability two",
        "Fixture capability three",
      ],
      action: "See Fixture Flagship",
      caption:
        "Brand identity artwork — not a screenshot of the running application.",
    },
    {
      lang: "vi",
      path: "/product-acts-vi/",
      profilePath: "/vi/products/fixture-flagship/",
      status: "Đang phát triển",
      eyebrow: "Sản phẩm chủ lực",
      description: "Mô tả thử nghiệm cho sản phẩm chủ lực.",
      jobsHeading: "Giúp bạn làm gì",
      jobs: ["Công việc thử nghiệm một", "Công việc thử nghiệm hai"],
      scopeHeading: "Đang xây dựng những gì",
      capabilities: [
        "Phạm vi thử nghiệm một",
        "Phạm vi thử nghiệm hai",
        "Phạm vi thử nghiệm ba",
      ],
      action: "Xem Fixture Flagship",
      caption:
        "Hình ảnh nhận diện thương hiệu — không phải ảnh chụp giao diện ứng dụng.",
    },
    {
      lang: "zh",
      path: "/product-acts-zh/",
      profilePath: "/zh/products/fixture-flagship/",
      status: "开发中",
      eyebrow: "旗舰产品",
      description: "旗舰产品的测试说明。",
      jobsHeading: "能帮你做什么",
      jobs: ["测试工作一", "测试工作二"],
      scopeHeading: "我们正在打造的产品",
      capabilities: ["测试范围一", "测试范围二", "测试范围三"],
      action: "查看 Fixture Flagship",
      caption: "品牌视觉素材，并非应用运行界面的截图。",
    },
  ]) {
    test(`${locale.lang}: theatre renders truth-driven from the fixture record`, async ({
      page,
    }) => {
      await page.goto(`${origin}${locale.path}`);

      // Exactly one theatre section.
      await expect(page.locator(THEATRE)).toHaveCount(1);

      // Act title is the record name.
      await expect(page.locator(TITLE)).toHaveText("Fixture Flagship");
      await expect(
        page.locator(`${THEATRE} [data-flagship-eyebrow]`),
      ).toHaveText(locale.eyebrow);
      await expect(
        page.getByRole("heading", { name: locale.jobsHeading }),
      ).toBeVisible();
      for (const job of locale.jobs) {
        await expect(page.locator(THEATRE)).toContainText(job);
      }
      await expect(
        page.getByRole("heading", { name: locale.scopeHeading }),
      ).toBeVisible();
      for (const capability of locale.capabilities) {
        await expect(page.locator(THEATRE)).toContainText(capability);
      }

      // Status family (subordinate, via ProductStatus) carries the record label.
      // Scoped to the status element: the theatre legitimately carries other
      // spans (truth-state chips, the proof affordance).
      const status = page.locator(`${THEATRE} [data-product-status]`);
      await expect(status).toHaveCount(1);
      expect((await status.textContent())?.trim()).toBe(locale.status);
      await expect(status).toHaveAttribute(
        "data-product-status",
        "In development",
      );

      // Short description present.
      await expect(page.locator(THEATRE)).toContainText(locale.description);

      // Exactly 3 capability items.
      const caps = page.locator(`${THEATRE} div.c2-flagship-theatre__feature`);
      await expect(caps).toHaveCount(3);

      // Primary action carries the lifecycle-derived verb (no Try for a
      // development record) and stays on the localized recorded-status page.
      await expect(
        page.locator(`${THEATRE} [data-product-cta="view-development-status"]`),
      ).toHaveCount(1);
      await expect(
        page.locator(`${THEATRE} [data-product-cta="try"]`),
      ).toHaveCount(0);
      const primaryLink = page.locator(
        `${THEATRE} a[href="${locale.profilePath}"]`,
      );
      await expect(primaryLink).toHaveCount(1);
      await expect(primaryLink).toContainText(locale.action);

      // Screenshot has intrinsic dimensions and non-empty alt from the record.
      const img = page.locator(`${THEATRE} img`);
      await expect(img).toBeVisible();
      await expect(img).toHaveAttribute(
        "alt",
        "Fixture flagship brand identity artwork",
      );
      await expect(img).toHaveAttribute(
        "src",
        "/products/fixtures/fixture-flagship.png",
      );
      await expect(img).toHaveAttribute("width", "1280");
      await expect(img).toHaveAttribute("height", "800");
      await expect(img).toHaveAttribute("loading", "lazy");
      await expect(img).toHaveAttribute("decoding", "async");
      await expect(
        page.locator(`${THEATRE} [data-flagship-ink-stage]`),
      ).toHaveCount(1);
      await expect(
        page.locator(`${THEATRE} .c2-flagship-theatre__device-frame`),
      ).toHaveCount(0);
      await expect(
        page.locator(`${THEATRE} .c2-flagship-theatre__window-controls`),
      ).toHaveCount(0);
      await expect(page.locator(`${THEATRE} figcaption`)).toHaveText(
        locale.caption,
      );
      // Opacity stays 1 (no fade-in).
      const opacity = await img.evaluate((el) => getComputedStyle(el).opacity);
      expect(opacity).toBe("1");
    });

    test(`${locale.lang}: continuity hook is exactly one unique media name`, async ({
      page,
    }) => {
      await page.goto(`${origin}${locale.path}`);

      // Exactly one continuity element.
      await expect(page.locator(CONTINUITY)).toHaveCount(1);

      // Inline style carries the derived view-transition-name.
      const el = page.locator(CONTINUITY);
      const inlineStyle = (await el.getAttribute("style")) ?? "";
      expect(inlineStyle).toContain(
        "view-transition-name: product-media-fixture-flagship",
      );

      // Uniqueness in document: no other element carries the same name.
      // (Verified via inline-style read; if the environment does not expose
      // viewTransitionName via computed style, we fall back to the inline
      // style attribute as the authoritative source.)
      const allInlineNames = await page.evaluate(() => {
        return Array.from(document.querySelectorAll("[style]"))
          .map((n) => (n as HTMLElement).getAttribute("style") ?? "")
          .filter((s) => s.includes("view-transition-name"));
      });
      const mediaNames = allInlineNames.filter((s) =>
        s.includes("product-media-fixture-flagship"),
      );
      expect(
        mediaNames.length,
        "media continuity name must be unique in document",
      ).toBe(1);
    });
  }
});

test.describe("public flagship capture presentation (Experience v6 S2)", () => {
  for (const locale of [
    {
      lang: "en",
      path: "/en/",
      label: /^Captured when the product was still named Sổ Trọ · sample data/,
    },
    {
      lang: "vi",
      path: "/vi/",
      label: /^Ảnh chụp khi sản phẩm còn tên Sổ Trọ · dữ liệu mẫu/,
    },
    { lang: "zh", path: "/zh/", label: /^截图时产品名为 Sổ Trọ · 示例数据/ },
    {
      lang: "zh-hant",
      path: "/zh-hant/",
      label: /^截圖時產品名為 Sổ Trọ · 範例資料/,
    },
  ]) {
    test(`${locale.lang}: homepage shows a labelled real Sổ Trọ capture, no app chrome, no identity art`, async ({
      page,
    }) => {
      test.skip(!hasPublicProducts, "No published hero product is available");
      await page.goto(locale.path);

      const theatre = page.locator(THEATRE);
      await expect(theatre.locator(TITLE)).toHaveText("YENLUME");
      await expect(theatre.locator("[data-flagship-ink-stage]")).toHaveCount(1);
      await expect(
        theatre.locator(".c2-flagship-theatre__device-frame"),
      ).toHaveCount(0);
      await expect(
        theatre.locator(".c2-flagship-theatre__window-controls"),
      ).toHaveCount(0);
      // UX P2-9: a wide and a narrow capture are both in the DOM; exactly one
      // is visible at any width.
      const capture = theatre
        .locator("[data-flagship-capture]")
        .filter({ visible: true });
      await expect(capture).toHaveCount(1);
      // v8 W2 (hom-11): one truth label per capture group; the hero capture
      // carries it, this second capture has none.
      await expect(capture.locator("figcaption")).toHaveCount(0);
      await expect(page.locator("[data-hero-flagship] figcaption")).toHaveText(
        locale.label,
      );
      await expect(capture.locator("img")).toHaveAttribute(
        "src",
        /\/products\/sotro\/showcase\/[a-z0-9-]+\.webp$/,
      );
      await expect(theatre.locator('img[src*="identity"]')).toHaveCount(0);
    });
  }
});

test.describe("C2 Flagship Theatre — no JavaScript (static-first)", () => {
  let origin = "";
  let closeServer = () => Promise.resolve();

  test.beforeAll(async () => {
    const server = await startFixtureServer();
    origin = server.origin;
    closeServer = server.close;
  });

  test.afterAll(async () => {
    await closeServer();
  });

  test.use({ javaScriptEnabled: false });

  test("fixture theatre content and actions render without JavaScript", async ({
    page,
  }) => {
    await page.goto(`${origin}/product-acts/`);
    await expect(page.locator("[data-flagship-theatre]")).toHaveCount(1);
    await expect(page.locator("#flagship-theatre-title")).toHaveText(
      "Fixture Flagship",
    );
    // Both the verb and the profile destination render without JavaScript;
    // the development lifecycle still withholds Try.
    await expect(
      page.locator(`${THEATRE} [data-product-cta="view-development-status"]`),
    ).toHaveCount(1);
    await expect(
      page.locator(`${THEATRE} [data-product-cta="try"]`),
    ).toHaveCount(0);
    await expect(
      page.locator(`${THEATRE} a[href='/en/products/fixture-flagship/']`),
    ).toHaveCount(1);
  });
});

test.describe("C2 Flagship Theatre — real-site absence (honesty)", () => {
  for (const locale of [
    { lang: "en", home: "/en/" },
    { lang: "vi", home: "/vi/" },
  ]) {
    test(`${locale.home} empty registry: no theatre, no media continuity, clean vocabulary`, async ({
      page,
    }, testInfo) => {
      test.skip(
        hasPublicProducts,
        "Public products are published; empty registry absence only applies when registry is empty",
      );
      // The REAL site (baseURL), not the fixture app: the production registry is
      // empty, so the act must be absent rather than filled with a shell.
      await page.goto(locale.home);

      await expect(page.locator("[data-flagship-theatre]")).toHaveCount(0);
      await expect(
        page.locator('[data-product-continuity="media"]'),
      ).toHaveCount(0);
      annotateAbsent(testInfo, locale.home);

      // No photo slot, app shell or fake product CTA may stand in for it.
      await expect(page.locator("[data-flagship-proof]")).toHaveCount(0);

      const bodyText = await page.locator("body").textContent();
      expect(bodyText ?? "").not.toMatch(BANNED_ASSURANCE);
    });
  }

  test("fixture theatre renders no invented assurance vocabulary", async ({
    page,
  }) => {
    const server = await startFixtureServer();
    try {
      await page.goto(`${server.origin}/product-acts/`);
      const theatre = page.locator("[data-flagship-theatre]");
      await expect(theatre).toHaveCount(1);
      const text = (await theatre.textContent()) ?? "";
      // The act's copy comes only from the record plus canonical labels.
      expect(text).not.toMatch(BANNED_ASSURANCE);
      expect(text).toContain("In development");
    } finally {
      await server.close();
    }
  });
});
