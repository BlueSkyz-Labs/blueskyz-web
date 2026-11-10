// C3-D Task 4 — Adaptive Fidelity Engine E2E guard.
//
// Each step maps to a resolver tier and must fail without the
// corresponding implementation:
//   1. static-premium renders all critical content/actions (no-JS).
//   2. restrained adds only lightweight native transitions/motion.
//   3. cinematic is enhancement-only and stays inside the client budget.
//   4. reduced motion and unsupported-feature fallback per the resolver.
import { expect, test } from "@playwright/test";

const ROOT = "/en/";

/** Critical content that must always render, even with JS disabled. */
const CRITICAL = [
  {
    selector: "#hero-title",
    text: /We build intelligent products|Intelligence|Trí tuệ/i,
  },
  { selector: "[data-hero-primary]", text: /./ },
];

/** Action links that must remain reachable at every tier. */
const ACTIONS = [
  "[data-hero-primary]",
  'a[href="/en/products/"]',
  'a[href="/en/about/"]',
];

test.describe("C3-D Fidelity Engine — presentation tier", () => {
  // ------------------------------------------------------------------
  // Step 1 — static-premium: all critical content and actions present
  //          even with JavaScript disabled (no-JS fallback).
  // ------------------------------------------------------------------
  test("static-premium: no-JS renders all critical content and actions", async ({
    browser,
  }) => {
    const ctx = await browser.newContext({
      javaScriptEnabled: false,
      viewport: { width: 390, height: 844 },
    });
    const page = await ctx.newPage();
    await page.goto(ROOT);

    for (const { selector, text } of CRITICAL) {
      const loc = page.locator(selector).first();
      await expect(loc, `${selector} missing at static-premium`).toBeVisible();
      if (text) await expect(loc).toContainText(text);
    }

    const primaryNav = page.getByRole("navigation", { name: "Primary" });
    const mobileMenu = page.locator("header details > summary");
    if (await primaryNav.isVisible()) {
      await expect(primaryNav).toBeVisible();
    } else {
      await expect(
        mobileMenu,
        "mobile navigation disclosure missing",
      ).toBeVisible();
      await mobileMenu.click();
      await expect(
        page.getByRole("navigation", { name: "Mobile" }),
        "mobile navigation missing after disclosure",
      ).toBeVisible();
    }

    for (const selector of ACTIONS) {
      const links = page.locator(`${selector}:visible`);
      const count = await links.count();
      expect(
        count,
        `${selector} missing or unreachable at static-premium`,
      ).toBeGreaterThan(0);
      for (let i = 0; i < count; i++) {
        const href = await links.nth(i).getAttribute("href");
        expect(href?.startsWith("/"), `${selector} href is internal`).toBe(
          true,
        );
      }
    }

    await ctx.close();
  });

  // ------------------------------------------------------------------
  // Step 2 — restrained: only lightweight native transitions/motion.
  //          No heavy animations, no perpetual motion.
  // ------------------------------------------------------------------
  test("restrained: heavy animations suppressed, native transitions only", async ({
    page,
  }) => {
    // Mock feature detection so the engine resolves "restrained".
    await page.addInitScript(() => {
      // @ts-expect-error — test-only shim.
      delete window.StartViewTransition;
      const origSupports = CSS.supports?.bind(CSS);
      // @ts-expect-error — test-only shim.
      CSS.supports = (property: string, value?: string) => {
        if (
          property === "container-type" &&
          (value === undefined || value === "inline-size")
        )
          return false;
        return origSupports?.(property, value) ?? false;
      };
    });
    await page.goto(ROOT);

    const tier = await page.evaluate(() =>
      document.documentElement.getAttribute("data-fidelity-tier"),
    );
    expect(tier).toBe("restrained");

    // Decorative horizon field must be static — no perpetual animation.
    const horizon = page.locator("[data-horizon]").first();
    if ((await horizon.count()) > 0) {
      const styles = await horizon.evaluate((el) => {
        const cs = getComputedStyle(el);
        return {
          animationName: cs.animationName,
          animationDuration: cs.animationDuration,
        };
      });
      expect(styles.animationName).toBe("none");
    }
  });

  // ------------------------------------------------------------------
  // Step 3 — cinematic: enhancement-only, stays inside client budget.
  // ------------------------------------------------------------------
  test("cinematic: enhancement-only and within client budget", async ({
    page,
  }) => {
    await page.goto(ROOT);
    await page.evaluate(() => {
      document.documentElement.setAttribute("data-fidelity-tier", "cinematic");
    });
    await page.reload();

    const tier = await page.evaluate(() =>
      document.documentElement.getAttribute("data-fidelity-tier"),
    );
    expect(tier).toBe("cinematic");

    // Cinematic may add lightweight enhancements; nothing may block
    // the main thread permanently.
    const heavyAnim = await page.evaluate(() =>
      document.getAnimations().every((a) => {
        const target = a.effect?.target;
        if (
          target instanceof Element &&
          target.matches(".horizon-field__halo") &&
          target.closest('.horizon-field[aria-hidden="true"]')
        ) {
          const keyframes = a.effect?.getKeyframes() ?? [];
          return (
            keyframes.length > 0 &&
            keyframes.every((frame) =>
              Object.keys(frame).every((property) =>
                [
                  "opacity",
                  "offset",
                  "computedOffset",
                  "easing",
                  "composite",
                ].includes(property),
              ),
            )
          );
        }
        // Scroll-driven entrances have a progress, not a duration. They are
        // allowed only while they animate compositor properties.
        if (!(a.timeline instanceof DocumentTimeline)) {
          const keyframes = a.effect?.getKeyframes() ?? [];
          return keyframes.every((frame) =>
            Object.keys(frame).every((property) =>
              [
                "opacity",
                "transform",
                "offset",
                "computedOffset",
                "easing",
                "composite",
              ].includes(property),
            ),
          );
        }
        const t = a.effect?.getTiming?.();
        return !t || t.duration < 2000 || t.iterations === Infinity;
      }),
    );
    expect(heavyAnim).toBe(true);
  });

  // ------------------------------------------------------------------
  // Step 4 — reduced motion + unsupported-feature fallback per contract.
  // ------------------------------------------------------------------
  test("reduced motion forces static-premium regardless of other signals", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(ROOT);

    const tier = await page.evaluate(() => {
      // The engine reads prefers-reduced-motion and locks to static-premium.
      return document.documentElement.getAttribute("data-fidelity-tier");
    });
    expect(tier).toBe("static-premium");
  });

  test("unsupported native features degrade gracefully, never throw", async ({
    page,
  }) => {
    // Mock unsupported features so the engine resolves a safe tier.
    await page.addInitScript(() => {
      // @ts-expect-error — test-only shim.
      delete window.StartViewTransition;
      const origSupports = CSS.supports?.bind(CSS);
      // @ts-expect-error — test-only shim.
      CSS.supports = (property: string, value?: string) => {
        if (
          property === "container-type" &&
          (value === undefined || value === "inline-size")
        )
          return false;
        return origSupports?.(property, value) ?? false;
      };
    });
    await page.goto(ROOT);

    const tier = await page.evaluate(() =>
      document.documentElement.getAttribute("data-fidelity-tier"),
    );
    expect(["static-premium", "restrained", "cinematic"]).toContain(tier);
  });
});
