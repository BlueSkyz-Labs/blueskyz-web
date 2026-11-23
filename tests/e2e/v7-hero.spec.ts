import { expect, test, type Page } from "@playwright/test";
import { hasPublicProducts } from "./product-helpers.ts";

/**
 * v7 W1 — hero flagship card at phone widths, legible capture on desktop, and
 * no git revision in visitor-facing text.
 *
 * Negative proof (in this file): the same checkers are run against a card whose
 * CTA is squeezed with `overflow-wrap:anywhere` and against text that contains
 * a 7-char revision, and must report a defect.
 */

/** Words of the CTA label that the browser split across two or more lines. */
async function brokenWords(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const cta = document.querySelector("[data-hero-primary]")!;
    const walker = document.createTreeWalker(cta, NodeFilter.SHOW_TEXT);
    const broken: string[] = [];
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const text = node.textContent ?? "";
      for (const match of text.matchAll(/\S+/g)) {
        const range = document.createRange();
        range.setStart(node, match.index!);
        range.setEnd(node, match.index! + match[0].length);
        const tops = new Set(
          Array.from(range.getClientRects()).map((r) => Math.round(r.top)),
        );
        if (tops.size > 1) broken.push(match[0]);
      }
    }
    return broken;
  });
}

/** A 7-char lowercase hex token containing at least one digit and one letter. */
function visibleHash(text: string): string | null {
  for (const m of text.matchAll(/\b[0-9a-f]{7}\b/g)) {
    if (/\d/.test(m[0]) && /[a-f]/.test(m[0])) return m[0];
  }
  return null;
}

for (const lang of ["en", "vi", "zh"] as const) {
  for (const width of [320, 360, 390]) {
    test(`/${lang}/ at ${width}: CTA never breaks inside a word, text column >= 240px`, async ({
      page,
    }) => {
      test.skip(!hasPublicProducts, "No published hero product is available");
      await page.setViewportSize({ width, height: 800 });
      await page.goto(`/${lang}/`);
      expect(await brokenWords(page)).toEqual([]);
      const body = await page
        .locator(".hero-flagship__body")
        .evaluate((el) => el.getBoundingClientRect().width);
      expect(body).toBeGreaterThanOrEqual(240);
      const noOverflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth,
      );
      expect(noOverflow, "no horizontal scroll").toBe(true);
    });
  }
}

test("negative proof: a squeezed CTA with overflow-wrap:anywhere is detected", async ({
  page,
}) => {
  test.skip(!hasPublicProducts, "No published hero product is available");
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto("/en/");
  await page.addStyleTag({
    content:
      "[data-hero-primary]{width:80px!important;overflow-wrap:anywhere!important;word-break:break-all!important}",
  });
  expect((await brokenWords(page)).length).toBeGreaterThan(0);
});

test("CTA accessible name carries the product and starts with the visible label", async ({
  page,
}) => {
  test.skip(!hasPublicProducts, "No published hero product is available");
  await page.goto("/en/");
  const cta = page.locator("[data-hero-primary]");
  const visible = (await cta.innerText()).trim();
  const name = (await cta.getAttribute("aria-label")) ?? "";
  expect(name.startsWith(visible)).toBe(true);
  expect(name).toContain("YENLUME");
});

test("1440: the capture renders at a legible width", async ({ page }) => {
  test.skip(!hasPublicProducts, "No published hero product is available");
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/en/");
  const box = await page
    .locator("[data-hero-flagship] [data-flagship-capture] img")
    .boundingBox();
  expect(box!.width).toBeGreaterThanOrEqual(240);
});

for (const lang of ["en", "vi", "zh", "zh-hant"] as const) {
  for (const path of ["", "products/sotro/", "products/sotro/guide/"]) {
    test(`/${lang}/${path}: no git revision in visible text`, async ({
      page,
    }) => {
      test.skip(!hasPublicProducts, "No published hero product is available");
      await page.goto(`/${lang}/${path}`);
      const text = await page.locator("body").innerText();
      expect(visibleHash(text)).toBeNull();
    });
  }
}

test("negative proof: the hash checker flags a visible revision", () => {
  expect(visibleHash("sample data b2b3388 · 2026-09-30")).toBe("b2b3388");
  expect(visibleHash("revision b2b3388")).toBe("b2b3388");
  expect(visibleHash("sample data · 2026-09-30")).toBeNull();
});

test("the hero keeps the sample-data label and the date, not the revision", async ({
  page,
}) => {
  test.skip(!hasPublicProducts, "No published hero product is available");
  await page.goto("/en/");
  const caption = page.locator("[data-hero-flagship] figcaption");
  await expect(caption).toContainText("sample data");
  // Wave G2: the visible date goes through Dateline (localized); the ISO
  // capture date stays pinned on the <time> element and the data hook.
  await expect(caption).toContainText("October 25, 2026");
  await expect(caption.locator("time")).toHaveAttribute(
    "datetime",
    "2026-10-25",
  );
  const capture = page.locator("[data-hero-flagship] [data-flagship-capture]");
  await expect(capture).toHaveAttribute("data-capture-date", "2026-10-25");
  await expect(capture).toHaveAttribute(
    "data-capture-revision",
    /^[0-9a-f]{7}$/,
  );
});

test("product line sits directly under the H1 and names both products as plain text", async ({
  page,
}) => {
  test.skip(!hasPublicProducts, "No published hero product is available");
  await page.goto("/en/");
  const line = page.locator("[data-hero-product-line]");
  await expect(line).toBeVisible();
  // Owner 2026-10-20 (ACQ-10): names are text; the profiles stay one tap away
  // through the hero CTA and the second-product entry chip.
  await expect(line.locator("a")).toHaveCount(0);
  await expect(line.locator("[data-hero-product-name]")).toHaveText([
    "YENLUME",
    "Sổ Tâm",
  ]);
  await expect(
    page.locator("[data-hero-flagship] [data-hero-primary]"),
  ).toHaveAttribute("href", "/en/products/sotro/");
  await expect(page.locator("[data-hero-entry='sotam']")).toHaveAttribute(
    "href",
    "/en/products/sotam/",
  );
  const h1 = await page.locator("h1").boundingBox();
  const box = await line.boundingBox();
  expect(box!.y).toBeGreaterThanOrEqual(h1!.y + h1!.height);
});
