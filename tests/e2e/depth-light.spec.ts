// Depth light and the closing horizon (Owner 2026-11-10).
//
// Both are enhancements for a fine pointer and welcome motion. These tests
// prove the contract around them: the capture answers the pointer and comes
// back to rest, and with reduced motion or on a touch screen the page is the
// plain static composition.
import { expect, test, type Page } from "@playwright/test";

const PROFILE = "/en/products/sotro/";

const pose = (page: Page) =>
  page.locator(".phero__art").evaluate((node) => ({
    active: node.hasAttribute("data-depth-active"),
    transform: getComputedStyle(node).transform,
  }));

async function hoverCapture(page: Page) {
  const box = await page.locator(".phero__art").boundingBox();
  await page.mouse.move(box!.x + box!.width * 0.85, box!.y + box!.height * 0.2);
}

/** The lean is offered only where the browser reports a hovering fine pointer. */
async function requireFinePointer(page: Page) {
  const fine = await page.evaluate(
    () => matchMedia("(hover: hover) and (pointer: fine)").matches,
  );
  test.skip(!fine, "this browser profile reports no hovering fine pointer");
}

test.describe("fine pointer, motion welcome", () => {
  test.use({
    reducedMotion: "no-preference",
    viewport: { width: 1440, height: 900 },
  });

  test("the product capture leans toward the pointer and returns to rest", async ({
    page,
  }) => {
    await page.goto(PROFILE, { waitUntil: "load" });
    await requireFinePointer(page);
    const rest = await pose(page);
    expect(rest.active).toBe(false);

    await hoverCapture(page);
    await expect
      .poll(async () => (await pose(page)).active, { timeout: 5_000 })
      .toBe(true);
    await expect
      .poll(async () => (await pose(page)).transform, { timeout: 5_000 })
      .not.toBe(rest.transform);

    await page.mouse.move(4, 4);
    await expect.poll(async () => (await pose(page)).active).toBe(false);
    await expect
      .poll(async () => (await pose(page)).transform, { timeout: 5_000 })
      .toBe(rest.transform);
  });

  test("the capture stays decorative: no focus stop, no layout shift", async ({
    page,
  }) => {
    await page.goto(PROFILE, { waitUntil: "load" });
    await requireFinePointer(page);
    const title = page.locator("h1").first();
    const before = await title.boundingBox();
    await hoverCapture(page);
    await expect
      .poll(async () => (await pose(page)).active, { timeout: 5_000 })
      .toBe(true);
    expect(await title.boundingBox()).toEqual(before);
    expect(
      await page
        .locator(".phero__art")
        .evaluate((node) => (node as HTMLElement).tabIndex),
    ).toBe(-1);
  });
});

test.describe("reduced motion", () => {
  test.use({
    reducedMotion: "reduce",
    viewport: { width: 1440, height: 900 },
  });

  test("the capture does not move and the footer keeps its plain edge", async ({
    page,
  }) => {
    await page.goto(PROFILE, { waitUntil: "load" });
    await hoverCapture(page);
    await page.waitForTimeout(400);
    expect(await pose(page)).toEqual({ active: false, transform: "none" });
    expect(
      await page
        .locator(".site-footer")
        .evaluate((node) => getComputedStyle(node, "::before").content),
    ).toBe("none");
  });
});

test.describe("touch screens", () => {
  test.use({
    reducedMotion: "no-preference",
    viewport: { width: 390, height: 844 },
    hasTouch: true,
  });

  test("a tap on the capture does not tilt it", async ({
    page,
    browserName,
  }) => {
    test.skip(
      browserName === "firefox",
      "isMobile is not supported in Firefox",
    );
    await page.goto(PROFILE, { waitUntil: "load" });
    const art = page.locator(".phero__art");
    await art.scrollIntoViewIfNeeded();
    await art.tap();
    await page.waitForTimeout(300);
    expect((await pose(page)).active).toBe(false);
  });
});
