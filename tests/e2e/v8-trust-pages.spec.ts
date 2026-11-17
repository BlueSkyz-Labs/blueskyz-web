import { expect, test, type Page } from "@playwright/test";

/**
 * v8 W5a: density, structure and layout of /verify, /security and /privacy.
 * Negative proof: the pre-v8 build fails each cap (verify 187 words and 40
 * links, security 374 words, privacy 280 words, a full-width 1256 px security
 * CTA, a 40 px / 400 H2 on privacy, a BilingualMirror block on security).
 */
const LANGS = ["en", "vi", "zh", "zh-hant"] as const;

// EN caps are the plan's targets. The other locales get the plan's length
// allowance for their script (Vietnamese is syllable-delimited, CJK is counted
// by whitespace tokens, which under-counts, so it is bounded by the EN cap).
const CAPS = {
  // vi 230 (was 215): TRU-10 (Owner 2026-10-20) glosses "người bảo trì" and
  // "issue công khai" once on first use (+15 words, the verbatim glosses).
  verify: { en: 160, vi: 230, zh: 160, "zh-hant": 160 },
  security: { en: 120, vi: 150, zh: 120, "zh-hant": 120 },
  // vi 225 (was 210): ADR 0015 requires the notice to state what the beacon
  // sends; the observed fields (Owner decision 2026-10-20, option A) need ~15
  // more syllables than the 207 the page already used. The pre-v8 280 still fails.
  // vi 231 (was 225): TRU-10 glosses "header yêu cầu" once (+8 words).
  // en 198 (was 160), vi 282 (was 231): the notice must disclose the anonymous
  // aggregate event counter (golive analytics, Owner 2026-11-17); the addition
  // is one sentence per language (+38 en, +52 vi) and is the only growth.
  privacy: { en: 198, vi: 282, zh: 160, "zh-hant": 160 },
} as const;

async function words(page: Page): Promise<number> {
  return page
    .locator("main")
    .evaluate((el) => (el as HTMLElement).innerText.trim().split(/\s+/).length);
}

async function visibleLinks(page: Page): Promise<number> {
  const links = page.locator("main a");
  let count = 0;
  for (const link of await links.all()) {
    if (await link.isVisible()) count += 1;
  }
  return count;
}

for (const lang of LANGS) {
  for (const route of ["verify", "security", "privacy"] as const) {
    test(`/${lang}/${route}/ stays within its word cap`, async ({ page }) => {
      await page.goto(`/${lang}/${route}/`);
      expect(await words(page)).toBeLessThanOrEqual(CAPS[route][lang]);
    });
  }

  test(`/${lang}/verify/ has at most 12 visible calls to action`, async ({
    page,
  }) => {
    await page.goto(`/${lang}/verify/`);
    expect(await visibleLinks(page)).toBeLessThanOrEqual(12);
    // The map is one closed disclosure; the retired layers are gone.
    const layers = page.locator("details[data-verify-layer]");
    await expect(layers).toHaveCount(1);
    expect(
      await layers.first().evaluate((el) => (el as HTMLDetailsElement).open),
    ).toBe(false);
    await expect(page.locator("[data-source-trace]")).toHaveCount(0);
  });

  test(`/${lang}/security/ has no bilingual mirror, no repeated sections, one CTA`, async ({
    page,
  }) => {
    await page.goto(`/${lang}/security/`);
    await expect(page.locator(".bilingual-mirror")).toHaveCount(0);
    await expect(page.locator("main h2")).toHaveCount(0);
    await expect(page.locator("[data-journey-bar]")).toHaveCount(0);
    await expect(page.locator("[data-safe-action]")).toHaveCount(1);
  });

  test(`/${lang}/privacy/ has no off-scale headings and no next-steps bar`, async ({
    page,
  }) => {
    await page.goto(`/${lang}/privacy/`);
    await expect(page.locator("[data-journey-bar]")).toHaveCount(0);
    const headings = await page.locator("main h2").evaluateAll((els) =>
      els.map((el) => {
        const s = getComputedStyle(el);
        return { size: parseFloat(s.fontSize), weight: Number(s.fontWeight) };
      }),
    );
    for (const heading of headings) {
      expect(heading.size).toBeLessThanOrEqual(32);
      expect(heading.weight).toBeGreaterThanOrEqual(600);
    }
  });
}

test("security CTA is as wide as its label, not the 1256 px container", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/en/security/");
  const cta = page.locator("[data-safe-action] a");
  const box = await cta.boundingBox();
  const header = await page.locator("main h1").boundingBox();
  expect(box?.width ?? 9999).toBeLessThan(400);
  expect(box?.width ?? 9999).toBeLessThanOrEqual(header?.width ?? 0);
});

// EX-19 replaces the v8 "rail beside the claim from 1024 px" assertion: the
// sources now sit directly under their statement at every width, left-aligned
// with it, and both sections share one column width.
test("verify puts the sources under the claim at every width and keeps one column", async ({
  page,
}) => {
  for (const width of [1440, 1280, 1024, 768, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/en/verify/");
    const claim = await page
      .locator(".verify-claim__main")
      .first()
      .boundingBox();
    const rail = await page
      .locator(".verify-claim__sources")
      .first()
      .boundingBox();
    expect(rail!.y, `${width}: sources below the statement`).toBeGreaterThan(
      claim!.y + claim!.height - 1,
    );
    expect(
      Math.abs(rail!.x - claim!.x),
      `${width}: sources share the statement's left edge`,
    ).toBeLessThanOrEqual(1);
    expect(
      rail!.y - (claim!.y + claim!.height),
      `${width}: sources sit directly under the claim`,
    ).toBeLessThanOrEqual(40);
    const claims = await page.locator("[data-verify-claims]").boundingBox();
    const backs = await page.locator("[data-verify-backs]").boundingBox();
    expect(
      Math.abs(claims!.width - backs!.width),
      `${width}: both sections share one max width`,
    ).toBeLessThanOrEqual(1);
  }
});

test("negative proof (EX-19): a sources rail beside the claim is caught", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/en/verify/");
  await page.addStyleTag({
    content:
      "@media (min-width:1024px){.verify-claim{grid-template-columns:20rem 20rem!important}}",
  });
  const claim = await page.locator(".verify-claim__main").first().boundingBox();
  const rail = await page
    .locator(".verify-claim__sources")
    .first()
    .boundingBox();
  expect(rail!.y > claim!.y + claim!.height - 1).toBe(false);
});

test("the CTA-count guard fails when the retired layers are opened", async ({
  page,
}) => {
  // Negative proof: with the claim map open the page exceeds 12 links.
  await page.goto("/en/verify/");
  await page.locator('details[data-verify-layer="atlas"] summary').click();
  expect(await visibleLinks(page)).toBeGreaterThan(12);
});
