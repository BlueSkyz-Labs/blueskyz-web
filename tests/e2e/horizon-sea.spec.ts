// Horizon Sea: the living layer of the home hero (Owner 2026-11-10).
//
// The scene is an enhancement. These tests prove the contract around it:
// it runs only when motion is welcome, the visitor can pause it (WCAG 2.2.2),
// it never covers or moves the hero content, and with reduced motion the hero
// is the plain static composition with no dead control.
import { expect, test, type Page } from "@playwright/test";

const HOMES = ["/en/", "/vi/"] as const;

/** Count of canvas pixels that carry any paint. */
const paintedPixels = (page: Page) =>
  page.evaluate(() => {
    const canvas =
      document.querySelector<HTMLCanvasElement>("[data-horizon-sea]");
    const context = canvas?.getContext("2d");
    if (!canvas || !context || canvas.width === 0) return 0;
    const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
    let painted = 0;
    for (let index = 3; index < data.length; index += 4) {
      if (data[index] !== 0) painted += 1;
    }
    return painted;
  });

const frame = (page: Page) =>
  page.evaluate(
    () =>
      document
        .querySelector<HTMLCanvasElement>("[data-horizon-sea]")
        ?.toDataURL() ?? "",
  );

test.describe("motion welcome", () => {
  test.use({ reducedMotion: "no-preference" });

  for (const home of HOMES) {
    test(`${home} the sea runs behind the hero and can be paused`, async ({
      page,
    }) => {
      await page.goto(home);
      const hero = page.locator("[data-horizon-sea-root]");
      const toggle = page.locator("[data-horizon-sea-toggle]");
      await expect(hero).toHaveAttribute("data-horizon-sea-state", "running");
      await expect(toggle).toBeVisible();
      await expect
        .poll(() => paintedPixels(page), { timeout: 10_000 })
        .toBeGreaterThan(500);

      // The control names what it will do, in the page language.
      const pauseLabel = await toggle.getAttribute("data-label-pause");
      const playLabel = await toggle.getAttribute("data-label-play");
      expect(pauseLabel).toBeTruthy();
      expect(playLabel).toBeTruthy();
      expect(pauseLabel).not.toBe(playLabel);
      await expect(toggle).toHaveAttribute("aria-label", pauseLabel!);

      // Paused: the label flips and the picture holds still.
      await toggle.click();
      await expect(hero).toHaveAttribute("data-horizon-sea-state", "paused");
      await expect(toggle).toHaveAttribute("aria-label", playLabel!);
      const held = await frame(page);
      await page.waitForTimeout(400);
      expect(await frame(page)).toBe(held);

      // Resumed: the picture moves again.
      await toggle.click();
      await expect(hero).toHaveAttribute("data-horizon-sea-state", "running");
      await expect.poll(() => frame(page), { timeout: 5_000 }).not.toBe(held);
    });
  }

  test("the scene never covers or moves the hero content", async ({ page }) => {
    await page.goto("/en/");
    const before = await page.locator("#hero-title").boundingBox();
    await expect(page.locator("[data-horizon-sea-toggle]")).toBeVisible();
    await expect
      .poll(() => paintedPixels(page), { timeout: 10_000 })
      .toBeGreaterThan(500);
    const after = await page.locator("#hero-title").boundingBox();
    expect(after).toEqual(before);

    // The primary action is the topmost element at its own centre.
    const topmost = await page.evaluate(() => {
      const action = document.querySelector<HTMLElement>(
        "[data-hero-flagship] [data-hero-primary], .hero-actions a",
      );
      if (!action) return false;
      const box = action.getBoundingClientRect();
      const hit = document.elementFromPoint(
        box.left + box.width / 2,
        box.top + box.height / 2,
      );
      return hit !== null && action.contains(hit);
    });
    expect(topmost).toBe(true);

    // The canvas is decorative and takes no pointer or assistive focus.
    const canvas = page.locator("[data-horizon-sea]");
    await expect(canvas).toHaveAttribute("aria-hidden", "true");
    expect(
      await canvas.evaluate((node) => getComputedStyle(node).pointerEvents),
    ).toBe("none");
  });

  test("the pause control is a full-size target reachable by keyboard", async ({
    page,
  }) => {
    await page.goto("/en/");
    const toggle = page.locator("[data-horizon-sea-toggle]");
    await expect(toggle).toBeVisible();
    const box = await toggle.boundingBox();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeGreaterThanOrEqual(44);
    await toggle.focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("[data-horizon-sea-root]")).toHaveAttribute(
      "data-horizon-sea-state",
      "paused",
    );
  });
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  for (const home of HOMES) {
    test(`${home} nothing is drawn and no control is offered`, async ({
      page,
    }) => {
      await page.goto(home, { waitUntil: "load" });
      await page.waitForTimeout(800);
      await expect(page.locator("[data-horizon-sea-toggle]")).toBeHidden();
      await expect(page.locator("[data-horizon-sea-root]")).not.toHaveAttribute(
        "data-horizon-sea-state",
        /.+/,
      );
      expect(await paintedPixels(page)).toBe(0);
      // The sail and the capture keep their static pose.
      const pose = await page.evaluate(() => {
        const sail = document.querySelector<HTMLElement>(".hero-visual");
        const focal = document.querySelector<HTMLElement>("[data-hero-focal]");
        return {
          sail: sail?.getAttribute("style") ?? "",
          focal: focal?.getAttribute("style") ?? "",
        };
      });
      expect(pose).toEqual({ sail: "", focal: "" });
    });
  }
});
