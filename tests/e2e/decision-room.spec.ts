import { expect, test } from "@playwright/test";

const ROOM = "[data-decision-room]";
const EN = "/en/decision-room/";
const VI = "/vi/decision-room/";
const ZH = "/zh/decision-room/";

test.describe("decision room", () => {
  test("server-rendered items expose sources and compare buttons", async ({
    page,
  }) => {
    await page.goto(EN);
    const room = page.locator(ROOM);
    await expect(room).toBeVisible();
    const items = room.locator("[data-decision-item]");
    expect(await items.count()).toBeGreaterThanOrEqual(5);
    for (let index = 0; index < (await items.count()); index += 1) {
      await expect(items.nth(index).locator("a").first()).toBeVisible();
      await expect(
        items.nth(index).getByRole("button", { name: "Compare" }),
      ).toBeVisible();
    }
    // v8 dec-2: the lede itself says "Nothing is ranked or recommended";
    // everything else must still carry no score, ranking or recommendation.
    const text = (await room.innerText()).replace(
      "Nothing is ranked or recommended.",
      "",
    );
    expect(text).not.toMatch(/score|ranking|recommend/i);
  });

  test("without JavaScript the facts and sources remain usable", async ({
    browser,
  }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto(EN);
    const room = page.locator(ROOM);
    await expect(room).toBeVisible();
    await expect(room.locator("[data-decision-item] a").first()).toBeVisible();
    await expect(room.locator("[data-decision-add]").first()).toBeHidden();
    await expect(room.locator("[data-decision-board]")).toBeHidden();
    // TRU-11: with scripting off the "nothing selected" line is hidden (the
    // page cannot select anything); the static lede replaces the JS lede.
    await expect(room.locator("[data-decision-empty-state]")).toBeHidden();
    await context.close();
  });

  test("selection is bounded at four with a polite announcement", async ({
    page,
  }) => {
    await page.goto(EN);
    const room = page.locator(ROOM);
    const adds = room.locator("[data-decision-add]");
    const total = await adds.count();
    for (let index = 0; index < 4; index += 1) {
      await adds.nth(index).click();
    }
    await expect(room.locator("[data-decision-board]")).toBeVisible();
    await expect(
      room.locator("[data-decision-board] [data-decision-row]:not([hidden])"),
    ).toHaveCount(4);
    const live = room.locator("[data-decision-live]");
    await expect(live).toHaveAttribute("aria-live", "polite");
    await expect(live).toHaveText("4/4 compared");
    if (total > 4) {
      await expect(adds.nth(4)).toBeDisabled();
    }
    await expect(adds.nth(0)).toHaveAttribute("aria-pressed", "true");
  });

  test("removing with the keyboard updates the workspace", async ({ page }) => {
    await page.goto(EN);
    const room = page.locator(ROOM);
    await room.locator("[data-decision-add]").nth(0).click();
    await room.locator("[data-decision-add]").nth(1).click();
    await expect(room.locator("[data-decision-row]:not([hidden])")).toHaveCount(
      2,
    );
    const remove = room
      .locator("[data-decision-row]:not([hidden]) [data-decision-remove]")
      .first();
    await remove.focus();
    await page.keyboard.press("Enter");
    await expect(room.locator("[data-decision-row]:not([hidden])")).toHaveCount(
      1,
    );
    await expect(room.locator("[data-decision-live]")).toHaveText(
      "1/4 compared",
    );
  });

  test("reset clears the workspace; the comparison lives only in the URL, never in storage", async ({
    page,
  }) => {
    await page.goto(EN);
    const room = page.locator(ROOM);
    await room.locator("[data-decision-add]").nth(0).click();
    // The selection is carried by the address bar (replaceState), so a reload
    // restores exactly it - and nothing is written to storage or cookies.
    await page.reload();
    await expect(room.locator("[data-decision-board]")).toBeVisible();
    const storage = await page.evaluate(() => ({
      local: window.localStorage.length,
      session: window.sessionStorage.length,
      cookies: document.cookie,
    }));
    expect(storage).toEqual({ local: 0, session: 0, cookies: "" });
    await room.locator("[data-decision-reset]").click();
    await expect(room.locator("[data-decision-board]")).toBeHidden();
    await expect(room.locator("[data-decision-add]").nth(0)).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(new URL(page.url()).search).toBe("");
    await page.reload();
    await expect(room.locator("[data-decision-board]")).toBeHidden();
    await expect(room.locator("[data-decision-empty-state]")).toBeVisible();
  });

  test("comparison makes no network requests after load", async ({ page }) => {
    await page.goto(EN);
    // Chromium fetches the favicon lazily after `load`; let page-load traffic
    // settle so only requests caused by the interaction below are counted.
    await page.waitForLoadState("networkidle");
    const requests: string[] = [];
    page.on("request", (request) => {
      requests.push(request.url());
    });
    const room = page.locator(ROOM);
    await room.locator("[data-decision-add]").nth(0).click();
    await room.locator("[data-decision-add]").nth(1).click();
    await room.locator("[data-decision-reset]").click();
    expect(requests).toEqual([]);
  });

  test("the home no longer hosts trust deep-links; the room stays reachable", async ({
    page,
  }) => {
    // Experience v6 S1 removed the Trust ledger cards (and their per-card
    // "Compare in the Decision Room" hooks) from the home; S3 re-stages them on
    // /verify. The room keeps its own routes: the products journey bar and the
    // command navigator still lead to it. Owner 2026-10-12: the products
    // journey bar no longer offers it (/verify is the one trust door); the page
    // itself stays published.
    await page.goto("/en/");
    await expect(page.locator("[data-decision-hook]")).toHaveCount(0);
    await page.goto("/en/products/");
    await expect(
      page.locator('[data-journey-bar] a[href="/en/decision-room/"]'),
    ).toHaveCount(0);
    await expect(
      page.locator('[data-journey-bar] a[href="/en/verify/"]'),
    ).toHaveCount(1);
    const response = await page.goto("/en/decision-room/");
    expect(response?.status()).toBe(200);
    await expect(page.locator(ROOM)).toBeVisible();
  });

  test("VI room is localized", async ({ page }) => {
    await page.goto(VI);
    const room = page.locator(ROOM);
    await expect(
      room.getByRole("button", { name: "So sánh" }).first(),
    ).toBeVisible();
    await room.getByRole("button", { name: "So sánh" }).first().click();
    await expect(room.locator("[data-decision-board]")).toBeVisible();
    await expect(room.locator("[data-decision-live]")).toHaveText(
      "Đang so sánh 1/4",
    );
  });

  test("ZH public pages keep metadata and page headings localized", async ({
    page,
  }) => {
    for (const [path, title, heading, description] of [
      [
        "/zh/",
        "BlueSkyz Labs",
        "我们打造智能化产品，赋能个人并提升工作方式。",
        "BlueSkyz Labs 的两款产品：给越南房东的收租账本 YENLUME 现已开放给所有人；保存在手机上的私密日记 Sổ Tâm 仍在开发中。",
      ],
      [
        "/zh/about/",
        "关于我们",
        "关于 BlueSkyz Labs",
        "BlueSkyz Labs 打造软件产品。了解我们目前在做什么，以及我们所说内容背后的公开依据，方便你自行核实。",
      ],
      [
        ZH,
        "比较声明",
        "比较声明",
        "并排比较最多四条 BlueSkyz Labs 公开声明，并查看每条声明的证据与来源。本页只做并列，不下结论。",
      ],
    ] as const) {
      await page.goto(path);
      await expect(page.locator("html")).toHaveAttribute("lang", "zh-Hans");
      await expect(page).toHaveTitle(new RegExp(title));
      await expect(page.getByRole("heading", { level: 1 })).toContainText(
        heading,
      );
      await expect(page.locator('meta[name="description"]')).toHaveAttribute(
        "content",
        description,
      );
    }
    const room = page.locator(ROOM);
    await expect(
      room.getByRole("button", { name: "对比" }).first(),
    ).toBeVisible();
  });

  test("390px keeps the room stacked and scrollable", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(EN);
    const room = page.locator(ROOM);
    await expect(room).toBeVisible();
    await room.locator("[data-decision-add]").nth(0).click();
    await expect(room.locator("[data-decision-board]")).toBeVisible();
    const overflow = await page.evaluate(() => {
      return (
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth
      );
    });
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
