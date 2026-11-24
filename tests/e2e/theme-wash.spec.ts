import { expect, test } from "@playwright/test";

/**
 * Theme wash (Owner 2026-11-24): pressing the theme icon reveals the new
 * theme as a soft-edged circle growing from the press point (View
 * Transitions). Keyboard presses grow from the icon's centre. Engines
 * without View Transitions and reduced motion switch at once.
 */

const trigger = ".theme-control--header [data-theme-trigger]";

async function washState(page: import("@playwright/test").Page) {
  return page.evaluate(() => {
    const root = document.documentElement;
    return {
      wash: root.hasAttribute("data-theme-wash"),
      x: root.style.getPropertyValue("--theme-wash-x"),
      y: root.style.getPropertyValue("--theme-wash-y"),
      theme: root.getAttribute("data-theme"),
    };
  });
}

test.describe("theme wash", () => {
  test.use({ reducedMotion: "no-preference", colorScheme: "light" });

  test("a pointer press grows the new theme from the press point", async ({
    page,
    browserName,
  }) => {
    test.skip(browserName !== "chromium", "View Transitions engine check");
    await page.goto("/en/");
    const box = (await page.locator(trigger).boundingBox())!;
    const px = Math.round(box.x + 5);
    const py = Math.round(box.y + 7);
    // Read the state inside the same task as the click, before the
    // transition can finish.
    const during = await page.evaluate(
      ([sel, x, y]) => {
        const el = document.querySelector<HTMLElement>(sel as string)!;
        el.dispatchEvent(
          new MouseEvent("click", {
            bubbles: true,
            clientX: x as number,
            clientY: y as number,
            detail: 1,
          }),
        );
        const root = document.documentElement;
        return {
          wash: root.hasAttribute("data-theme-wash"),
          x: root.style.getPropertyValue("--theme-wash-x"),
          y: root.style.getPropertyValue("--theme-wash-y"),
        };
      },
      [trigger, px, py],
    );
    expect(during).toEqual({ wash: true, x: `${px}px`, y: `${py}px` });
    await expect
      .poll(async () => (await washState(page)).wash, { timeout: 3000 })
      .toBe(false);
    const after = await washState(page);
    expect(after.theme).toBe("dark");
    expect(after.x).toBe("");
  });

  test("a keyboard press grows from the icon centre", async ({
    page,
    browserName,
  }) => {
    test.skip(browserName !== "chromium", "View Transitions engine check");
    await page.goto("/en/");
    const box = (await page.locator(trigger).boundingBox())!;
    const during = await page.evaluate((sel) => {
      const el = document.querySelector<HTMLElement>(sel)!;
      el.dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 0 }));
      const root = document.documentElement;
      return {
        x: parseFloat(root.style.getPropertyValue("--theme-wash-x")),
        y: parseFloat(root.style.getPropertyValue("--theme-wash-y")),
      };
    }, trigger);
    expect(Math.abs(during.x - (box.x + box.width / 2))).toBeLessThan(1);
    expect(Math.abs(during.y - (box.y + box.height / 2))).toBeLessThan(1);
  });
});

test.describe("theme wash under reduced motion", () => {
  test.use({ reducedMotion: "reduce", colorScheme: "light" });

  test("switches at once with no wash", async ({ page }) => {
    await page.goto("/en/");
    const state = await page.evaluate((sel) => {
      document.querySelector<HTMLElement>(sel)!.click();
      const root = document.documentElement;
      return {
        wash: root.hasAttribute("data-theme-wash"),
        theme: root.getAttribute("data-theme"),
      };
    }, trigger);
    expect(state).toEqual({ wash: false, theme: "dark" });
  });
});
