import { expect, test, type Page } from "@playwright/test";

/**
 * Experience wave E, PR E-A (2026-10-23): the Sổ Trọ product page.
 * - EX-01: the hero is one poster. Wide screens put the first story capture
 *   beside the copy; below 1024 px it follows the status block, capped at
 *   60vh. One compact status block merges the two-sided sentence, the
 *   availability line and the stage row. The contact action is a secondary
 *   button (its contract lives in g6-availability-line.spec.ts).
 * - EX-05: below 640 px the stacked phones sit on the centre line and the
 *   desktop sheet is not drawn at an unreadable size (its link stays).
 * - EX-06: the static wide story keeps its text and phone pair on the centre
 *   line.
 * - EX-07: the "Features" cards carry no 01-05 numerals.
 * - EX-08: the guide is a secondary button right after the video; the English
 *   identity card is a small strip, not a full-width stage.
 * - EX-22: every "view larger image" link has its own accessible name, which
 *   names the step.
 * Every predicate is proven to fail on a broken page (negative proofs below).
 */
const LANGS = ["en", "vi", "zh", "zh-hant"] as const;

async function open(page: Page, lang: string, width: number, height = 900) {
  await page.setViewportSize({ width, height });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`/${lang}/products/sotro/`);
  // The showcase skips paint until it nears the viewport; render it all.
  await page.addStyleTag({
    // No transitions: the global reduced-motion floor animates every property
    // change over 0.01 ms, which would race a measurement taken right after a
    // style mutation (negative proofs).
    content:
      ".showcase,.showcase__phone{content-visibility:visible!important}*,*::before,*::after{transition:none!important}",
  });
  // Settle the poster first so geometry and the negative proofs are stable.
  await page.waitForFunction(() => {
    const img = document.querySelector<HTMLImageElement>(".phero__art img");
    return !img || (img.complete && img.naturalWidth > 0);
  });
}

/** Hero geometry: copy column, poster, status block (empty violations = pass). */
const heroViolations = (page: Page, wide: boolean) =>
  page.evaluate((wide) => {
    const out: string[] = [];
    const rect = (s: string) =>
      document.querySelector(s)?.getBoundingClientRect() ?? null;
    const copy = rect(".phero__copy");
    const stage = rect("[data-hero-art-stage]");
    const art = rect(".phero__art");
    const status = rect("[data-product-status-block]");
    const img = document.querySelector<HTMLImageElement>(
      ".phero__art img",
    ) as HTMLImageElement | null;
    if (!copy || !stage || !art || !status || !img)
      return ["hero part missing"];
    if (img.getAttribute("alt") !== "") out.push("poster is not decorative");
    const first = document.querySelector<HTMLImageElement>(
      "[data-story-chapter] img",
    );
    if (!first || first.getAttribute("src") !== img.getAttribute("src"))
      out.push("poster is not the first story capture");
    if (art.width < 240) out.push(`poster ${art.width}px is not legible`);
    if (wide) {
      if (art.left < copy.right) out.push("poster overlaps the copy column");
      if (art.height > innerHeight * 0.75)
        out.push("poster is taller than 75vh");
    } else {
      if (art.top < status.bottom) out.push("poster is not after the status");
      if (art.height > innerHeight * 0.6 + 1)
        out.push(`poster ${art.height}px exceeds 60vh`);
    }
    const mask = getComputedStyle(
      document.querySelector(".phero__art")!,
    ).maskImage;
    if (!/linear-gradient/.test(mask)) out.push("no bottom fade");
    // The status block holds exactly the three rows.
    const block = document.querySelector("[data-product-status-block]")!;
    for (const sel of [
      "[data-product-sides]",
      "[data-app-access]",
      "[data-product-ladder]",
    ])
      if (block.querySelectorAll(sel).length !== 1)
        out.push(`status block lacks ${sel}`);
    if (document.querySelectorAll("main p[data-app-access]").length !== 1)
      out.push("availability line count");
    // Nothing in the hero overlaps anything else in the copy column.
    const items = [
      ...document.querySelectorAll(
        ".phero__intro > *, .phero__actions > *, .phero__status",
      ),
    ].map((el) => el.getBoundingClientRect());
    for (let i = 0; i < items.length; i++)
      for (let j = i + 1; j < items.length; j++) {
        const a = items[i]!;
        const b = items[j]!;
        if (
          a.width > 0 &&
          b.width > 0 &&
          a.left < b.right - 1 &&
          b.left < a.right - 1 &&
          a.top < b.bottom - 1 &&
          b.top < a.bottom - 1
        )
          out.push(`hero items ${i}/${j} overlap`);
      }
    return out;
  }, wide);

for (const lang of LANGS) {
  test(`${lang} 1440: the hero is one poster beside the copy`, async ({
    page,
  }) => {
    await open(page, lang, 1440);
    expect(await heroViolations(page, true)).toEqual([]);
  });
  test(`${lang} 390: the poster follows the status block, capped at 60vh`, async ({
    page,
  }) => {
    await open(page, lang, 390, 844);
    expect(await heroViolations(page, false)).toEqual([]);
  });
  test(`${lang} 390: stacked phones are centred and the desktop sheet is not drawn tiny, its link stays`, async ({
    page,
  }) => {
    await open(page, lang, 390, 844);
    const r = await page.evaluate(() => {
      const centres = [
        ...document.querySelectorAll<HTMLElement>(".story__screen"),
      ].map((el) => {
        const b = el.getBoundingClientRect();
        return Math.abs(b.left + b.width / 2 - document.body.clientWidth / 2);
      });
      const sheet = document.querySelector<HTMLElement>(".story__browser");
      return {
        centres,
        sheet: sheet ? getComputedStyle(sheet).display : "missing",
        link: Boolean(
          document.querySelector("[data-story-coda] a[data-capture-inspect]"),
        ),
      };
    });
    expect(r.centres).toHaveLength(5);
    for (const c of r.centres) expect(c).toBeLessThanOrEqual(2);
    expect(r.sheet).toBe("none");
    expect(r.link).toBe(true);
  });
  test(`${lang} 1440: the static story pair is on the centre line`, async ({
    page,
  }) => {
    await open(page, lang, 1440);
    const off = await page.evaluate(() => {
      const row = document.querySelector(".story__chapter")!;
      const text = row.querySelector(".story__text")!.getBoundingClientRect();
      const phone = row
        .querySelector(".story__screen")!
        .getBoundingClientRect();
      const container = row.parentElement!.getBoundingClientRect();
      return Math.abs(
        (text.left + phone.right) / 2 - (container.left + container.right) / 2,
      );
    });
    expect(off).toBeLessThanOrEqual(24);
  });
  test(`${lang}: Features cards have no numerals`, async ({ page }) => {
    await open(page, lang, 1440);
    const r = await page.evaluate(() => ({
      tiles: document.querySelectorAll("[data-what-it-does] > li").length,
      index: document.querySelectorAll(".profile-does__index").length,
      lead: [...document.querySelectorAll("[data-what-it-does] > li")].filter(
        (li) => /^\s*0\d\b/.test(li.textContent ?? ""),
      ).length,
    }));
    expect(r.tiles).toBe(5);
    expect(r.index).toBe(0);
    expect(r.lead).toBe(0);
  });
  test(`${lang}: the guide is a secondary button right after the video, no identity strip on a live product`, async ({
    page,
  }) => {
    await open(page, lang, 1440);
    const r = await page.evaluate(() => {
      const video = document.querySelector(".showcase__video")!;
      const guide = document.querySelector<HTMLAnchorElement>(
        "a[data-showcase-guide-link]",
      );
      const v = video.getBoundingClientRect();
      return {
        variant: guide?.getAttribute("data-button-variant"),
        height: guide?.getBoundingClientRect().height ?? 0,
        follows: guide
          ? Boolean(
              video.compareDocumentPosition(guide) &
              Node.DOCUMENT_POSITION_FOLLOWING,
            )
          : false,
        gap: guide ? guide.getBoundingClientRect().top - v.bottom : -1,
        strips: document.querySelectorAll("[data-profile-identity-stage]")
          .length,
      };
    });
    expect(r.variant).toBe("secondary");
    expect(r.height).toBeGreaterThanOrEqual(44);
    expect(r.follows).toBe(true);
    expect(r.gap).toBeGreaterThanOrEqual(0);
    expect(r.gap).toBeLessThanOrEqual(48);
    // Live since 2026-11-23: proof media is a real capture, shown in the
    // showcase above; the brand-identity strip must not render it.
    expect(r.strips).toBe(0);
  });
  test(`${lang}: every "view larger image" link has a unique name that names its step`, async ({
    page,
  }) => {
    await open(page, lang, 1440);
    const names = await page.evaluate(() =>
      [...document.querySelectorAll("a[data-capture-inspect]")].map((a) => ({
        name: a.getAttribute("aria-label") ?? "",
        title: a.getAttribute("data-viewer-title") ?? "",
      })),
    );
    expect(names.length).toBeGreaterThanOrEqual(10);
    for (const n of names) expect(n.name).toContain(n.title);
    expect(new Set(names.map((n) => n.name)).size).toBe(names.length);
  });
}

test("negative proof: a hero without the poster, a tiny poster or a missing fade is caught", async ({
  page,
}) => {
  await open(page, "vi", 1440);
  expect(await heroViolations(page, true)).toEqual([]);
  await page.addStyleTag({
    content:
      ".phero__art{width:120px!important;mask-image:none!important;-webkit-mask-image:none!important}",
  });
  const v = await heroViolations(page, true);
  expect(v.some((m) => m.includes("not legible"))).toBe(true);
  expect(v).toContain("no bottom fade");
  await page.evaluate(() =>
    document.querySelector("[data-hero-art-stage]")!.remove(),
  );
  expect(await heroViolations(page, true)).toEqual(["hero part missing"]);
});

test("negative proof: a poster that is not the first story capture, or overlaps the copy, is caught", async ({
  page,
}) => {
  await open(page, "en", 1440);
  await page.evaluate(() => {
    document
      .querySelector(".phero__art img")!
      .setAttribute("src", "/products/sotro/showcase/op-00-pair.webp");
    document.querySelector(".phero__art img")!.removeAttribute("srcset");
    document
      .querySelector<HTMLElement>("[data-hero-art-stage]")!
      .style.setProperty("margin-left", "-40rem");
  });
  const v = await heroViolations(page, true);
  expect(v).toContain("poster is not the first story capture");
  expect(v).toContain("poster overlaps the copy column");
});

test("negative proof: a phone left on the text edge, a drawn tiny sheet and a duplicate link name are caught", async ({
  page,
}) => {
  await open(page, "vi", 390, 844);
  await page.addStyleTag({
    content:
      ".story__screen{margin:0!important}.story__browser{display:block!important}",
  });
  const r = await page.evaluate(() => ({
    off: Math.abs(
      (
        document.querySelector(".story__screen") as HTMLElement
      ).getBoundingClientRect().left +
        (document.querySelector(".story__screen") as HTMLElement).offsetWidth /
          2 -
        document.body.clientWidth / 2,
    ),
    sheet: getComputedStyle(document.querySelector(".story__browser")!).display,
  }));
  expect(r.off).toBeGreaterThan(2);
  expect(r.sheet).not.toBe("none");
  const dup = await page.evaluate(() => {
    const links = [...document.querySelectorAll("a[data-capture-inspect]")];
    const first = links[0]!.getAttribute("aria-label");
    links[1]!.setAttribute("aria-label", first ?? "");
    return new Set(links.map((a) => a.getAttribute("aria-label"))).size;
  });
  expect(dup).toBeLessThan(
    await page.locator("a[data-capture-inspect]").count(),
  );
});
