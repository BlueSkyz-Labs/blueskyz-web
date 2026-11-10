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

/**
 * Pause the scene with its control. On a slow machine the scene may already
 * have stopped itself ("resting"); the first press then starts it, and from
 * that press on the scene never stops itself, so the second press pauses it.
 */
async function pauseScene(page: Page, press: () => Promise<void>) {
  const hero = page.locator("[data-horizon-sea-root]");
  await expect(hero).toHaveAttribute(
    "data-horizon-sea-state",
    /^(running|resting)$/,
  );
  await press();
  if ((await hero.getAttribute("data-horizon-sea-state")) === "running") {
    await press();
  }
  await expect(hero).toHaveAttribute("data-horizon-sea-state", "paused");
}

test.describe("motion welcome", () => {
  test.use({ reducedMotion: "no-preference" });

  for (const home of HOMES) {
    test(`${home} the sea runs behind the hero and can be paused`, async ({
      page,
    }) => {
      await page.goto(home);
      const hero = page.locator("[data-horizon-sea-root]");
      const toggle = page.locator("[data-horizon-sea-toggle]");
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

      // Paused: the label flips and the picture holds still.
      await pauseScene(page, () => toggle.click());
      await expect(toggle).toHaveAttribute("aria-label", playLabel!);
      const held = await frame(page);
      await page.waitForTimeout(400);
      expect(await frame(page)).toBe(held);

      // Resumed: the picture moves again.
      await toggle.click();
      await expect(hero).toHaveAttribute("data-horizon-sea-state", "running");
      await expect(toggle).toHaveAttribute("aria-label", pauseLabel!);
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
    await pauseScene(page, () => page.keyboard.press("Enter"));
  });
});

test.describe("the sail of light (large screens)", () => {
  test.use({
    reducedMotion: "no-preference",
    viewport: { width: 1440, height: 900 },
  });

  test("the static mark steps back only while the scene draws the sail", async ({
    page,
  }) => {
    await page.goto("/en/");
    const hero = page.locator("[data-horizon-sea-root]");
    await expect(hero).toHaveAttribute("data-horizon-sea-state", /.+/);
    await page.waitForTimeout(1500);
    // The scene may hand the sail back to the static mark on a slow machine
    // (its performance governor); either way exactly one sail is on show.
    const state = await page.evaluate(() => {
      const root = document.querySelector("[data-horizon-sea-root]")!;
      const mark = document.querySelector<HTMLElement>(".hero-visual")!;
      return {
        sail: root.hasAttribute("data-horizon-sail"),
        markOpacity: Number(getComputedStyle(mark).opacity),
      };
    });
    if (state.sail) expect(state.markOpacity).toBeLessThan(0.05);
    else expect(state.markOpacity).toBeGreaterThan(0.5);
  });

  test("a press on the bare scene never navigates or blocks the actions", async ({
    page,
  }) => {
    await page.goto("/en/");
    await expect(page.locator("[data-horizon-sea-toggle]")).toBeVisible();
    const hero = await page.locator("[data-horizon-sea-root]").boundingBox();
    // One press on the water (low in the hero), one on the sky (top edge).
    await page.mouse.click(
      hero!.x + hero!.width * 0.5,
      hero!.y + hero!.height - 30,
    );
    await page.mouse.click(hero!.x + hero!.width * 0.5, hero!.y + 12);
    await expect(page).toHaveURL(/\/en\/$/);
    const action = page
      .locator("[data-hero-flagship] [data-hero-primary], .hero-actions a")
      .first();
    const href = await action.getAttribute("href");
    await action.click();
    await expect(page).toHaveURL(new RegExp(`${href}$`));
  });
});

test.describe("phones", () => {
  test.use({
    reducedMotion: "no-preference",
    viewport: { width: 390, height: 844 },
  });

  test("the heavy 3D sail is not built below 1024px", async ({ page }) => {
    await page.goto("/en/");
    await expect(page.locator("[data-horizon-sea-toggle]")).toBeVisible();
    await page.waitForTimeout(600);
    await expect(page.locator("[data-horizon-sea-root]")).not.toHaveAttribute(
      "data-horizon-sail",
      /.*/,
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
