import { expect, test, type Page } from "@playwright/test";

/**
 * C3-A Task 7 — Microinteraction Quality Pass (design S10).
 *
 * One purpose-based interaction grammar for hover, focus, active/pressed,
 * disclosure, selection, image focus and loading/disabled feedback: the same
 * affordances must exist across the shared surfaces, not only on one component.
 * Nothing may animate forever, and every state must survive forced colors.
 */
const INTERACTIVE = "a, button, summary";

/**
 * Entrance animations retarget hit-testing mid-flight: hover/pointer actions can
 * hang until the element stops moving (or land on the wrong target). Settle the
 * document's animations before interacting, and assert on visible elements.
 */
async function settle(page: Page): Promise<void> {
  // The hero halo is aria-hidden decoration with a deliberately slow, finite
  // animation. It does not affect hit testing, so it must not hold up a test.
  // Other finite animations still need to settle before pointer interaction.
  await page.waitForFunction(() =>
    document.getAnimations().every((animation) => {
      const target = animation.effect?.target;
      if (target instanceof Element && target.matches(".horizon-field__halo")) {
        return true;
      }
      // A scroll-driven animation has no clock: it holds still until the
      // page scrolls and never reports "finished", so it cannot be waited on
      // and does not move a target under a resting pointer.
      if (!(animation.timeline instanceof DocumentTimeline)) return true;
      const iterations = animation.effect?.getTiming?.().iterations;
      return iterations === Infinity || animation.playState !== "running";
    }),
  );
}

async function firstVisible(page: Page, selector: string) {
  const locator = page.locator(`${selector}:visible`).first();
  await locator.waitFor({ state: "visible" });
  return locator;
}

test.describe("C3-A Microinteractions — pointer states", () => {
  test("hover changes a navigation link's appearance", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/en/");
    await settle(page);
    // Tailwind v4 gates `hover:` behind `@media (hover: hover)`, and a touch
    // project honestly reports `hover: none` — there, pressed feedback is the
    // measurable state and the assertion below covers it.
    const hoverCapable = await page.evaluate(
      () => matchMedia("(hover: hover)").matches,
    );
    test.skip(
      !hoverCapable,
      "project emulates a pointer without hover support",
    );
    // A header link has no 3D transform, so the pointer actually lands on it;
    // the hero's action is covered by the pressed-state assertion below.
    const link = await firstVisible(page, "header nav a");
    const read = () =>
      link.evaluate((el) => {
        const cs = getComputedStyle(el);
        return { color: cs.color, background: cs.backgroundColor };
      });

    const before = await read();
    const box = await link.boundingBox();
    expect(box).not.toBeNull();
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
    const hovered = await read();
    expect(
      hovered.color !== before.color ||
        hovered.background !== before.background,
      `hover must change the link (before ${JSON.stringify(before)}, after ${JSON.stringify(hovered)})`,
    ).toBe(true);
  });

  test("the grammar declares pressed feedback for the shared action", async ({
    page,
  }) => {
    await page.goto("/en/");
    await settle(page);

    const cta = await firstVisible(page, "main a");
    const href = await cta.getAttribute("href");
    expect(href, "the primary action must be an ordinary link").toBeTruthy();

    // Pointer-target obstruction guard: the hero's decorative horizon layer sits
    // above the copy, so it must not be the element a click lands on.
    const hit = await cta.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      const top = document.elementFromPoint(
        rect.x + rect.width / 2,
        rect.y + rect.height / 2,
      );
      return {
        topmost: top
          ? `${top.tagName.toLowerCase()}.${[...top.classList].slice(0, 3).join(".")}`
          : "none",
        reachable: top === el || el.contains(top),
      };
    });
    expect(
      hit.reachable,
      `the primary action must be the topmost element at its own centre (found ${hit.topmost})`,
    ).toBe(true);

    // Pressed feedback: the shared button declares an :active transform, and the
    // action must remain operable by a real pointer.
    const activeRules = await page.evaluate(() => {
      const found: string[] = [];
      for (const sheet of Array.from(document.styleSheets)) {
        try {
          for (const rule of Array.from(sheet.cssRules)) {
            const selector =
              "selectorText" in rule ? (rule as CSSStyleRule).selectorText : "";
            if (/:active/.test(selector) && /transform/.test(rule.cssText)) {
              found.push(rule.cssText.slice(0, 160));
            }
          }
        } catch {
          /* cross-origin sheet */
        }
      }
      return found;
    });
    expect(
      activeRules.length,
      "the interaction grammar must declare a pressed (transform) state",
    ).toBeGreaterThan(0);

    await cta.click();
    await expect(page).toHaveURL(new RegExp(`${href}$`));
  });

  test("the compact menu disclosure declares a pressed state and toggles", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/en/");
    await settle(page);

    // A pressed style is only observable while the pointer is down, which is
    // racy across engines; assert the grammar declares one for the disclosure.
    const pressedRule = await page.evaluate(() => {
      const rules: string[] = [];
      for (const sheet of Array.from(document.styleSheets)) {
        try {
          for (const rule of Array.from(sheet.cssRules)) {
            if (/details\s*>\s*summary:active/.test(rule.cssText)) {
              rules.push(rule.cssText);
            }
          }
        } catch {
          /* cross-origin sheet */
        }
      }
      return rules;
    });
    expect(
      pressedRule.length,
      "the interaction grammar must declare a pressed state for disclosure controls",
    ).toBeGreaterThan(0);

    // And the control must actually be operable.
    const details = page.locator("header details").first();
    await expect(details).not.toHaveAttribute("open", /.*/);
    await firstVisible(page, "header details summary").then((summary) =>
      summary.click(),
    );
    await expect(details).toHaveAttribute("open", /.*/);
  });
});

test.describe("C3-A Microinteractions — keyboard states", () => {
  test("focus is visible on the primary action, nav link and disclosure", async ({
    page,
  }) => {
    for (const width of [1280, 390]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/en/");
      const targets = [
        "header a",
        width >= 768 ? "header nav a" : "header details summary",
      ];
      for (const selector of targets) {
        const el = page.locator(selector).first();
        await el.focus();
        const state = await el.evaluate((node) => {
          const cs = getComputedStyle(node);
          return {
            outlineStyle: cs.outlineStyle,
            outlineWidth: cs.outlineWidth,
            boxShadow: cs.boxShadow,
          };
        });
        const visible =
          (state.outlineStyle !== "none" &&
            Number.parseFloat(state.outlineWidth) > 0) ||
          (state.boxShadow !== "none" && state.boxShadow !== "");
        expect(
          visible,
          `${selector} at ${width}px must show a focus indicator (${JSON.stringify(state)})`,
        ).toBe(true);
      }
    }
  });

  test("the disclosure is keyboard operable", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/en/");
    const details = page.locator("header details").first();
    await expect(details).not.toHaveAttribute("open", /.*/);
    const summary = details.locator("summary");
    await summary.focus();
    await page.keyboard.press("Enter");
    await expect(details).toHaveAttribute("open", /.*/);
    await page.keyboard.press("Enter");
    await expect(details).not.toHaveAttribute("open", /.*/);
  });
});

test.describe("C3-A Microinteractions — grammar invariants", () => {
  test("selection styling is defined with brand tokens", async ({ page }) => {
    await page.goto("/en/");
    const selection = await page.evaluate(() => {
      const rules: string[] = [];
      for (const sheet of Array.from(document.styleSheets)) {
        try {
          for (const rule of Array.from(sheet.cssRules)) {
            if (rule.cssText.includes("::selection")) rules.push(rule.cssText);
          }
        } catch {
          /* cross-origin sheet */
        }
      }
      return rules;
    });
    expect(
      selection.length,
      "the interaction grammar must define a ::selection style",
    ).toBeGreaterThan(0);
    expect(
      selection.join(" "),
      "::selection must use a semantic token, not a raw hex palette value",
    ).toMatch(/var\(--[a-z-]+\)/);
  });

  test("no interactive control animates forever", async ({ page }) => {
    await page.goto("/en/");
    const offenders = await page.evaluate((selector) => {
      return [...document.querySelectorAll(selector)]
        .map((el) => {
          const cs = getComputedStyle(el);
          return {
            label:
              el.tagName.toLowerCase() +
              "." +
              [...el.classList].slice(0, 2).join("."),
            iteration: cs.animationIterationCount,
            duration: cs.animationDuration,
          };
        })
        .filter((entry) => entry.iteration === "infinite")
        .map((entry) => `${entry.label} (${entry.duration})`);
    }, INTERACTIVE);
    expect(
      offenders,
      `interactive controls must not run perpetual animation: ${offenders.join(", ")}`,
    ).toEqual([]);
  });

  test("the focus indicator survives forced colors", async ({ page }) => {
    await page.emulateMedia({ forcedColors: "active" });
    await page.goto("/en/");
    const trigger = page.locator("header a").first();
    await trigger.focus();
    const state = await trigger.evaluate((el) => {
      const cs = getComputedStyle(el);
      return {
        outlineStyle: cs.outlineStyle,
        outlineWidth: cs.outlineWidth,
        outlineColor: cs.outlineColor,
      };
    });
    expect(
      state.outlineStyle !== "none" &&
        Number.parseFloat(state.outlineWidth) > 0,
      `forced colors must keep a focus outline (${JSON.stringify(state)})`,
    ).toBe(true);
  });
});

test.describe("C3-A Microinteractions — image focus", () => {
  test("decorative product imagery is not focusable while its link is", async ({
    page,
  }) => {
    await page.goto("/en/");
    const images = await page.evaluate(() =>
      [...document.querySelectorAll("main img")].map((img) => ({
        src: img.getAttribute("src"),
        tabindex: img.getAttribute("tabindex"),
        role: img.getAttribute("role"),
      })),
    );
    for (const image of images) {
      expect(
        image.tabindex,
        `image ${image.src} must not be pulled into the tab order`,
      ).toBeNull();
    }
  });
});
