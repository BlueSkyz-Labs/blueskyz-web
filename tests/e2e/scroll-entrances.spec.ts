// Scroll-driven entrances must actually run where the browser supports them.
//
// Regression (2026-11-10): the CSS minifier folded `animation-timeline: view()`
// into the `animation` shorthand. Chromium rejects a timeline there and drops
// the whole declaration, so every scroll-driven entrance on the site was
// silently static. The timeline is now named through `--view-timeline`; these
// tests read the computed animation in the built site, which is the only
// place the fold shows.
import { expect, test, type Page } from "@playwright/test";

const supportsViewTimeline = (page: Page) =>
  page.evaluate(() => CSS.supports("animation-timeline", "view()"));

const animationOf = (page: Page, selector: string, pseudo?: string) =>
  page.evaluate(
    ([target, part]) => {
      const node = document.querySelector(target!);
      return node ? getComputedStyle(node, part ?? null).animationName : null;
    },
    [selector, pseudo] as const,
  );

test.describe("motion welcome", () => {
  test.use({
    reducedMotion: "no-preference",
    viewport: { width: 1440, height: 900 },
  });

  test("the home hero, flagship stage and footer carry their entrances", async ({
    page,
  }) => {
    await page.goto("/en/", { waitUntil: "load" });
    test.skip(
      !(await supportsViewTimeline(page)),
      "this browser has no scroll-driven animations",
    );
    expect(await animationOf(page, ".hero-plane--ink > .hero-atmosphere")).toBe(
      "hero-parallax",
    );
    expect(await animationOf(page, ".c2-flagship-theatre__ink-stage")).toBe(
      "theatre-settle",
    );
    expect(await animationOf(page, ".site-footer", "::before")).toBe(
      "closing-horizon",
    );
  });

  test("the product story chapters rise in and end fully visible", async ({
    page,
  }) => {
    await page.goto("/en/products/sotro/", { waitUntil: "load" });
    test.skip(
      !(await supportsViewTimeline(page)),
      "this browser has no scroll-driven animations",
    );
    expect(await animationOf(page, ".story__text")).toBe("view-rise-text");

    // Once a chapter is well inside the viewport it is at its final state.
    const chapter = page.locator(".story__text").first();
    await chapter.evaluate((node) =>
      node.scrollIntoView({ block: "center", behavior: "instant" }),
    );
    await expect
      .poll(() => chapter.evaluate((node) => getComputedStyle(node).opacity))
      .toBe("1");
  });
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("no entrance is attached", async ({ page }) => {
    await page.goto("/en/products/sotro/", { waitUntil: "load" });
    expect(await animationOf(page, ".story__text")).toBe("none");
    expect(await animationOf(page, ".site-footer", "::before")).toBe("none");
  });
});
