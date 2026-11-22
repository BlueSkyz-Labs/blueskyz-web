import { expect, test, type Page } from "@playwright/test";

/**
 * v7 truth and content (W4). Measured in the rendered pages; the pure
 * predicates below are proven to fail on a broken input (negative proof) so a
 * green run cannot come from a detector that cannot fail.
 */

const LOCALES = ["en", "vi", "zh", "zh-hant"] as const;
const REPEAT_ROUTES = [
  "privacy",
  "security",
  "verify",
  "dossier",
  "decision-room",
  "editions/trust-foundations",
] as const;

/** 60 Latin characters; CJK carries about twice the information per character. */
const minLength = (sentence: string) => (/[㐀-鿿]/.test(sentence) ? 30 : 60);

function maxSentenceRepeat(text: string): number {
  const counts = new Map<string, number>();
  for (const line of text.split("\n")) {
    for (const piece of line.split(/(?<=[.!?。！？])\s*/)) {
      const sentence = piece.trim();
      if (sentence.length < minLength(sentence)) continue;
      counts.set(sentence, (counts.get(sentence) ?? 0) + 1);
    }
  }
  return Math.max(0, ...counts.values());
}

/** All text inside <main>, including collapsed disclosures and hidden layers, minus templates/scripts. */
async function mainText(page: Page): Promise<string> {
  return page.locator("main").evaluate((main) => {
    const out: string[] = [];
    const skip = new Set(["SCRIPT", "STYLE", "TEMPLATE", "NOSCRIPT"]);
    const block =
      /^(P|DIV|LI|H[1-6]|SECTION|DT|DD|SUMMARY|ARTICLE|A|SPAN|LABEL|TIME)$/;
    const walk = (node: Node) => {
      if (node.nodeType === 3) {
        out.push(node.textContent ?? "");
        return;
      }
      if (node.nodeType !== 1) return;
      const el = node as Element;
      if (skip.has(el.tagName)) return;
      const isBlock = block.test(el.tagName);
      if (isBlock) out.push("\n");
      el.childNodes.forEach(walk);
      if (isBlock) out.push("\n");
    };
    walk(main);
    return out.join("");
  });
}

test("negative proof: the repetition detector flags a sentence repeated three times", () => {
  const sentence =
    "This site sets no cookies and stores only the language and theme you chose.";
  expect(maxSentenceRepeat([sentence, sentence, sentence].join("\n"))).toBe(3);
  expect(maxSentenceRepeat([sentence, "other", sentence].join("\n"))).toBe(2);
  const zh =
    "安全报告通过 GitHub 私有渠道送达维护者，绝不会通过公开 issue 提出。";
  expect(maxSentenceRepeat([zh, zh, zh].join("\n"))).toBe(3);
});

for (const lang of LOCALES) {
  for (const route of REPEAT_ROUTES) {
    test(`/${lang}/${route}/ states no sentence more than twice`, async ({
      page,
    }) => {
      await page.goto(`/${lang}/${route}/`);
      const repeat = maxSentenceRepeat(await mainText(page));
      expect(repeat).toBeLessThanOrEqual(2);
    });
  }
}

const SUPPORT_PENDING: Record<(typeof LOCALES)[number], RegExp> = {
  en: /No general support mailbox has been published yet/,
  vi: /chưa có hộp thư hỗ trợ chung/,
  zh: /尚未公布通用支持邮箱/,
  "zh-hant": /尚未公布通用支援信箱/,
};
const SUPPORT_OVERCLAIM =
  /Working help and recourse|real routes, not slogans|khắc phục đang hoạt động|有效的(帮助|協助)与?|提供有效/;

const SUPPORT_PUBLISHED: Record<(typeof LOCALES)[number], RegExp> = {
  en: /A product-support mailbox is published here/,
  vi: /[Đđ]ã công bố hộp thư hỗ trợ sản phẩm/,
  zh: /已公布产品支持邮箱/,
  "zh-hant": /已公布產品支援信箱/,
};

for (const lang of LOCALES) {
  // The Support lane must match /support: "available" only when that page
  // publishes a mailbox, the pending wording otherwise.
  test(`/${lang}/verify/ Support row matches the published mailbox`, async ({
    page,
  }) => {
    await page.goto(`/${lang}/support/`);
    const hasMailbox =
      (await page.locator("main a[href^='mailto:']").count()) > 0;
    await page.goto(`/${lang}/verify/`);
    const row = page.locator('[data-trust-surface="support"]');
    await expect(row).toBeVisible();
    const text = await row.innerText();
    expect(text).not.toMatch(SUPPORT_OVERCLAIM);
    if (hasMailbox) {
      expect(text).toMatch(SUPPORT_PUBLISHED[lang]);
      expect(text).not.toMatch(SUPPORT_PENDING[lang]);
    } else {
      expect(text).toMatch(SUPPORT_PENDING[lang]);
      expect(text).not.toMatch(/Available|Có sẵn|可用/);
    }
    // The other two lanes keep their state.
    await expect(page.locator('[data-trust-surface="privacy"]')).toContainText(
      /Available|Có sẵn|可用/,
    );
  });
}

test("negative proof: published and pending Support wording never match each other", () => {
  for (const lang of LOCALES) {
    expect(SUPPORT_PENDING[lang].test(SUPPORT_PUBLISHED[lang].source)).toBe(
      false,
    );
    expect(SUPPORT_PUBLISHED[lang].test(SUPPORT_PENDING[lang].source)).toBe(
      false,
    );
  }
});

test("negative proof: the retired Support overclaim matches the guard", () => {
  expect(
    SUPPORT_OVERCLAIM.test(
      "Working help and recourse paths — real routes, not slogans.",
    ),
  ).toBe(true);
  expect(SUPPORT_OVERCLAIM.test("提供有效的協助與求助途徑")).toBe(true);
  expect(SUPPORT_OVERCLAIM.test(SUPPORT_PENDING.en.source)).toBe(false);
});

for (const lang of LOCALES) {
  test(`/${lang}/decision-room/ lists Support as unpublished, not available`, async ({
    page,
  }) => {
    await page.goto(`/${lang}/decision-room/`);
    const text = await page.locator("main").innerText();
    expect(text).not.toMatch(SUPPORT_OVERCLAIM);
  });
}

test("the /verify atlas names no jargon and shows no count legend", async ({
  page,
}) => {
  await page.goto("/en/verify/");
  const text = await mainText(page);
  expect(text).not.toMatch(/BlueSkyz Atlas|Public SGPS manifest|SGPS/);
  expect(text).not.toMatch(/Principle\s+\d|Trust\s+\d|Claim\s+\d|Product\s+\d/);
  await expect(page.locator(".atlas-legend")).toHaveCount(0);
  // v8 W5a: the "Source-linked" label is gone from /verify, so no legend.
  await expect(page.locator("[data-source-linked-legend]")).toHaveCount(0);
  expect(text).not.toMatch(/Source-linked/);
});

test("every local atlas link resolves to a real page and anchor", async ({
  page,
  request,
}) => {
  for (const lang of LOCALES) {
    await page.goto(`/${lang}/verify/`);
    const hrefs = await page
      .locator("[data-atlas] [data-atlas-node] a")
      .evaluateAll((els) =>
        els.map((el) => (el as HTMLAnchorElement).getAttribute("href") ?? ""),
      );
    expect(hrefs.length).toBeGreaterThanOrEqual(10);
    for (const href of new Set(hrefs)) {
      expect(href, `${lang}: no dead house anchor`).not.toContain(
        "#house-title",
      );
      if (/^https?:/.test(href)) continue;
      const [path, fragment] = href.split("#");
      const response = await request.get(path || `/${lang}/verify/`);
      expect(response.status(), `${lang}: ${href}`).toBe(200);
      if (fragment) {
        expect(await response.text(), `${lang}: ${href}`).toContain(
          `id="${fragment}"`,
        );
      }
    }
  }
});

test("negative proof: the old atlas target does not exist on the home page", async ({
  request,
}) => {
  const home = await (await request.get("/en/")).text();
  expect(home).not.toContain('id="house-title"');
});

test("evidence pages make the claim the single H1 with the label as eyebrow", async ({
  page,
}) => {
  for (const lang of LOCALES) {
    await page.goto(`/${lang}/evidence/security-reporting-is-private/`);
    const h1 = page.locator("h1");
    await expect(h1).toHaveCount(1);
    const eyebrow = page.locator("[data-passport-page-title]");
    await expect(eyebrow).toHaveCount(1);
    const [heading, label] = await Promise.all([
      h1.innerText(),
      eyebrow.innerText(),
    ]);
    expect(heading.trim().length).toBeGreaterThan(label.trim().length);
    expect(heading.trim()).not.toBe(label.trim());
    expect(await eyebrow.evaluate((el) => el.tagName)).toBe("P");
  }
  // Every evidence page has its own H1.
  const ids = [
    "security-reporting-is-private",
    "privacy-no-tracking-on-this-site",
    "registry-publishes-only-proven-products",
  ];
  const headings = new Set<string>();
  for (const id of ids) {
    await page.goto(`/en/evidence/${id}/`);
    headings.add((await page.locator("h1").innerText()).trim());
  }
  expect(headings.size).toBe(ids.length);
});

const DATE_TEXT: Record<(typeof LOCALES)[number], RegExp> = {
  en: /September 12, 2026/,
  vi: /12 tháng 9, 2026/,
  zh: /2026年9月12日/,
  "zh-hant": /2026年9月12日/,
};

for (const lang of LOCALES) {
  test(`/${lang}/evidence/ shows a localized review date with the ISO date kept`, async ({
    page,
  }) => {
    await page.goto(`/${lang}/evidence/security-reporting-is-private/`);
    const review = page.locator("[data-passport-review]");
    await expect(review).toHaveText(DATE_TEXT[lang]);
    await expect(review.locator("time")).toHaveAttribute(
      "datetime",
      "2026-09-12",
    );
    await expect(review).not.toContainText("2026-09-12");
  });
}

test("negative proof: an ISO date in the visible text would fail the date guard", () => {
  expect("Reviewed: 2026-09-12").not.toMatch(DATE_TEXT.en);
  expect("Reviewed: September 12, 2026").toMatch(DATE_TEXT.en);
});

test("product pages state the current stage only", async ({ page }) => {
  for (const lang of LOCALES) {
    await page.goto(`/${lang}/products/sotro/`);
    const stage = page.locator("[data-product-ladder]");
    await expect(stage).toHaveCount(1);
    await expect(stage.locator("li, details, ol")).toHaveCount(0);
    const text = await page.locator("main").innerText();
    expect(text).not.toMatch(
      /Next in the ladder|Giai đoạn kế tiếp|下一阶段|下一階段|All stages|Tất cả giai đoạn|全部阶段|全部階段/,
    );
  }
});

test("zh-hant carries no mainland terms and zh no 您 on the rendered trust pages", async ({
  page,
}) => {
  const hant = ["跟蹤", "行為畫像", "登記表", "目標地址"];
  for (const route of [
    "privacy",
    "security",
    "verify",
    "dossier",
    "decision-room",
  ]) {
    await page.goto(`/zh-hant/${route}/`);
    const text = await page.locator("main").innerText();
    for (const term of hant)
      expect(text, `${route}: ${term}`).not.toContain(term);
    await page.goto(`/zh/${route}/`);
    expect(await page.locator("main").innerText()).not.toContain("您");
  }
  await page.goto("/zh/");
  expect(await page.locator("main").innerText()).not.toContain("您");
});

// D-14 superseded by the Owner on 2026-10-12: the profile and the guide show
// no app sign-in; the guide footer keeps Support as its one action.
for (const lang of LOCALES) {
  test(`/${lang}/products/sotro/ keeps one primary action and no sign-in link`, async ({
    page,
  }) => {
    await page.goto(`/${lang}/products/sotro/`);
    await expect(page.locator("[data-primary-action]")).toHaveCount(1);
    await expect(page.locator("[data-app-signin]")).toHaveCount(0);
    // Public launch (Owner 2026-11-22): the one primary action opens the app
    // origin; it is the only link to it.
    await expect(
      page.locator('main a[href^="https://sotro.blueskyzlabs.com"]'),
    ).toHaveCount(1);
    await expect(page.locator("[data-primary-action]")).toHaveAttribute(
      "href",
      "https://sotro.blueskyzlabs.com/",
    );
  });

  test(`/${lang}/products/sotro/guide/ ends with Contact and no sign-in`, async ({
    page,
  }) => {
    await page.goto(`/${lang}/products/sotro/guide/`);
    const links = page.locator(".guide__footer a");
    await expect(links).toHaveCount(1);
    expect(await links.first().getAttribute("href")).toBe(`/${lang}/contact/`);
  });
}
