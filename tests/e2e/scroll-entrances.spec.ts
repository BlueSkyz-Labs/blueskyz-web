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

test.describe("entrances and tap targets", () => {
  test.use({
    reducedMotion: "no-preference",
    viewport: { width: 390, height: 844 },
  });

  // Engines differ on what an entrance shows before its block scrolls in
  // (WebKit holds the first keyframe, Chromium may skip it under
  // content-visibility), so this reads the keyframes instead of a rendered
  // size: a scroll-driven entrance on a block that holds a link or a button
  // must never scale it, or a 44px target measures 43px.
  for (const route of ["/en/products/sotro/", "/en/"]) {
    test(`${route} no scroll-driven entrance scales a link or button`, async ({
      page,
    }) => {
      await page.goto(route, { waitUntil: "load" });
      test.skip(
        !(await supportsViewTimeline(page)),
        "this browser has no scroll-driven animations",
      );
      const offenders = await page.evaluate(() => {
        const rows = new Set<string>();
        // Ask each element: document.getAnimations() leaves out animations
        // inside a section the browser is skipping (content-visibility).
        const animations = [...document.querySelectorAll("*")].flatMap(
          (element) => element.getAnimations(),
        );
        for (const animation of animations) {
          if (animation.timeline instanceof DocumentTimeline) continue;
          const effect = animation.effect;
          if (!(effect instanceof KeyframeEffect)) continue;
          // A pseudo-element's own entrance does not move its host's content.
          if (effect.pseudoElement) continue;
          const target = effect.target;
          if (!target?.querySelector("a[href], button")) continue;
          const scales = effect.getKeyframes().some((frame) => {
            const transform = String(frame.transform ?? "");
            return /scale|matrix/.test(transform) || frame.scale !== undefined;
          });
          if (scales) {
            rows.add(
              `${target.tagName.toLowerCase()}.${target.className} (${(animation as CSSAnimation).animationName})`,
            );
          }
        }
        return [...rows];
      });
      expect(offenders, offenders.join("\n")).toEqual([]);
    });
  }
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("no entrance is attached", async ({ page }) => {
    await page.goto("/en/products/sotro/", { waitUntil: "load" });
    expect(await animationOf(page, ".story__text")).toBe("none");
    expect(await animationOf(page, ".site-footer", "::before")).toBe("none");
  });
});
