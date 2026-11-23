import { expect, test, type Page } from "@playwright/test";
import { readdirSync, readFileSync } from "node:fs";

/**
 * Wave 1c audit fixes: ACQ-01 (story hard swap), ACQ-02 (task-word search),
 * ACQ-12 (header at 200% root font size).
 * Each guard has a negative proof where the detector must flag a break.
 */

// ---- ACQ-01 -----------------------------------------------------------------
async function doubleExposure(page: Page): Promise<number> {
  let both = 0;
  for (let y = 900; y <= 3600; y += 25) {
    await page.evaluate((v) => scrollTo(0, v), y);
    await page.waitForTimeout(50);
    const visible = await page.evaluate(
      () =>
        [...document.querySelectorAll("img")]
          .filter(
            (i) =>
              /op-0[1-5]/.test(i.currentSrc || i.src) &&
              // EX-01: the hero poster repeats the first capture outside the
              // sticky stage; it is not a stage frame.
              !i.closest("[data-product-hero]") &&
              i.getBoundingClientRect().left > 800,
          )
          .map((i) => {
            let o = 1;
            for (
              let e: Element | null = i;
              e && e !== document.body;
              e = e.parentElement
            )
              o *= parseFloat(getComputedStyle(e).opacity);
            return o;
          })
          .filter((o) => o >= 0.2).length,
    );
    if (visible >= 2) both += 1;
  }
  return both;
}

test.describe("ACQ-01 story screens hard-swap", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("at most 5 of 109 positions show two frames", async ({
    page,
    browserName,
  }) => {
    test.skip(browserName !== "chromium", "scroll-driven animation sampler");
    await page.goto("/en/products/sotro/");
    const supported = await page.evaluate(() =>
      CSS.supports("animation-timeline: view()"),
    );
    test.skip(!supported, "no view() timelines");
    expect(await doubleExposure(page)).toBeLessThanOrEqual(5);
  });

  test("negative proof: an injected long cross-fade is flagged", async ({
    page,
    browserName,
  }) => {
    test.skip(browserName !== "chromium", "scroll-driven animation sampler");
    await page.goto("/en/products/sotro/");
    const supported = await page.evaluate(() =>
      CSS.supports("animation-timeline: view()"),
    );
    test.skip(!supported, "no view() timelines");
    await page.addStyleTag({
      content: `@keyframes story-screen-old { 0%,22%{opacity:var(--story-in,0)} 32%,68%{opacity:1} 78%,100%{opacity:var(--story-out,0)} } .story__screen, .story__dots i { animation-name: story-screen-old !important; }`,
    });
    expect(await doubleExposure(page)).toBeGreaterThan(5);
  });
});

// ---- ACQ-02 -----------------------------------------------------------------
async function results(page: Page, lang: string, q: string) {
  await page.goto(`/${lang}/`);
  await page.keyboard.press("Control+k");
  await page.locator("[data-command-input]").fill(q);
  return page.locator("[data-command-item]:not([hidden]) a");
}

test.describe("ACQ-02 task words find the product", () => {
  test.use({ viewport: { width: 1280, height: 800 } });
  const cases: [string, string][] = [
    ["en", "rent"],
    ["en", "receipt"],
    ["en", "Zalo"],
    ["en", "meter"],
    ["vi", "thu tiền"],
    ["vi", "nhà trọ"],
    ["vi", "điện nước"],
    ["vi", "phòng trọ"],
    ["vi", "chủ nhà"],
  ];
  for (const [lang, q] of cases) {
    test(`${lang} "${q}" returns YENLUME first`, async ({ page }) => {
      const links = await results(page, lang, q);
      await expect(links.first()).toHaveText("YENLUME");
    });
  }

  test("nonsense still shows the empty state", async ({ page }) => {
    const links = await results(page, "en", "zzqx");
    await expect(links).toHaveCount(0);
    await expect(page.locator("[data-command-empty]")).toBeVisible();
  });

  test("no unpublished product text reaches the index", async ({ page }) => {
    const dir = "src/content/products";
    const hidden: string[] = [];
    for (const f of readdirSync(dir).filter((n) => n.endsWith(".yaml"))) {
      const src = readFileSync(`${dir}/${f}`, "utf8");
      if (!/^public:\s*false/m.test(src)) continue;
      const block = src.match(/^jobs:\n((?:\s+- .*\n)+)/m);
      for (const m of block?.[1].matchAll(/- (.+)\n/g) ?? [])
        hidden.push(m[1].trim());
    }
    expect(hidden.length).toBeGreaterThan(0);
    for (const lang of ["en", "vi", "zh", "zh-hant"]) {
      await page.goto(`/${lang}/`);
      const bodies = (
        await page
          .locator("[data-command-item]")
          .evaluateAll((els) =>
            els.map(
              (e) =>
                `${e.getAttribute("data-body")} ${e.getAttribute("data-keys")} ${e.getAttribute("data-title")}`,
            ),
          )
      ).join(" ");
      for (const text of hidden) expect(bodies).not.toContain(text);
    }
  });
});

// ---- ACQ-12 -----------------------------------------------------------------
test.describe("ACQ-12 header at 200% root font size", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  async function header(page: Page, size: string) {
    await page.goto("/en/");
    await page.evaluate(
      (v) => (document.documentElement.style.fontSize = v),
      size,
    );
    await page.waitForTimeout(200);
    return page.evaluate(() => {
      const hdr = document.querySelector("header")!;
      const link = [...hdr.querySelectorAll("nav a")].find(
        (a) =>
          a.getBoundingClientRect().width > 0 && !a.classList.contains("btn"),
      )!;
      const font = parseFloat(getComputedStyle(link).fontSize);
      const glyphs = [...hdr.querySelectorAll(".hc-glyph")]
        .filter((g) => g.getBoundingClientRect().width > 0)
        .map((g) => g.getBoundingClientRect().height);
      const centres = [
        ...hdr.querySelectorAll("nav a, nav button, nav .lang-switch__trigger"),
      ]
        .filter((e) => e.getBoundingClientRect().width > 0)
        .map((e) => {
          const r = e.getBoundingClientRect();
          return r.top + r.height / 2;
        });
      return {
        cap: font * 0.7,
        glyphs,
        spread: Math.max(...centres) - Math.min(...centres),
      };
    });
  }

  test("glyphs keep pace with the text and items share a centre line", async ({
    page,
  }) => {
    const h = await header(page, "200%");
    for (const g of h.glyphs) expect(g).toBeGreaterThanOrEqual(0.9 * h.cap);
    expect(h.spread).toBeLessThanOrEqual(2);
  });

  test("unchanged at 100%: 20px glyphs, one centre line", async ({ page }) => {
    const h = await header(page, "100%");
    expect(h.glyphs.slice(0, 2)).toEqual([20, 20]);
    expect(h.spread).toBeLessThanOrEqual(2);
  });

  test("negative proof: a fixed 14px glyph and flex-start switcher are flagged", async ({
    page,
  }) => {
    await page.goto("/en/");
    await page.addStyleTag({
      content:
        ".hc-glyph{width:14px!important;height:14px!important}.lang-switch--header{align-self:flex-start!important}",
    });
    await page.evaluate(
      () => (document.documentElement.style.fontSize = "200%"),
    );
    await page.waitForTimeout(200);
    const bad = await page.evaluate(() => {
      const hdr = document.querySelector("header")!;
      const g = [...hdr.querySelectorAll(".hc-glyph")]
        .filter((e) => e.getBoundingClientRect().width > 0)
        .map((e) => e.getBoundingClientRect().height);
      const sw = hdr
        .querySelector(".lang-switch__trigger")!
        .getBoundingClientRect();
      const a = [...hdr.querySelectorAll("nav a")]
        .find((x) => x.getBoundingClientRect().width > 0)!
        .getBoundingClientRect();
      return {
        smallGlyph: Math.min(...g) < 0.9 * 28 * 0.7,
        off: Math.abs(sw.top + sw.height / 2 - (a.top + a.height / 2)),
      };
    });
    expect(bad.smallGlyph).toBe(true);
    expect(bad.off).toBeGreaterThan(2);
  });
});
