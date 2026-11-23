/**
 * Go-live copy polish (Owner decisions 2026-10-01): C-12, C-21, C-36 and the
 * vi Sổ Trọ description. Each pinned string has a negative proof.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { PAGE_META, PRODUCT_META } from "../../src/data/page-meta.ts";
import { SHARED_LABELS } from "../../src/data/site.ts";

const LANGS = ["en", "vi", "zh", "zh-hant"];
const read = (p) => readFileSync(p, "utf8");

const DECISION_ROOM_TITLE = {
  en: "Compare claims",
  vi: "So sánh tuyên bố",
  zh: "比较声明",
  "zh-hant": "比較聲明",
};

/**
 * The page's <title> descriptor: an inline literal, or (v12 S2, metadata
 * moved to src/data/page-meta.ts) exactly this locale's
 * `PAGE_META[lang].decisionRoom.title`. Any other expression resolves to
 * undefined and fails the pin.
 */
const titleOf = (src, lang) => {
  const literal = src.match(/<BaseLayout\s+title="([^"]+)"/)?.[1];
  if (literal) return literal;
  const ref = new RegExp(
    `<BaseLayout\\s+title=\\{PAGE_META\\["${lang}"\\]\\.decisionRoom\\.title\\}`,
  );
  return ref.test(src) ? PAGE_META[lang].decisionRoom.title : undefined;
};

test("decision-room <title> uses the public name in every locale", () => {
  for (const lang of LANGS) {
    assert.equal(
      titleOf(read(`src/pages/${lang}/decision-room.astro`), lang),
      DECISION_ROOM_TITLE[lang],
      lang,
    );
  }
});

test("negative proof: a legacy decision-room title is detected", () => {
  const src = read("src/pages/en/decision-room.astro");
  // a legacy inline literal
  assert.notEqual(
    titleOf('<BaseLayout\n  title="Decision Room"', "en"),
    DECISION_ROOM_TITLE.en,
  );
  // another locale's or another page's metadata
  assert.equal(titleOf(src.replace('["en"]', '["vi"]'), "en"), undefined);
  assert.equal(
    titleOf(src.replace("decisionRoom.title", "home.title"), "en"),
    undefined,
  );
  // a legacy value in the metadata table
  assert.notEqual("Decision Room", PAGE_META.en.decisionRoom.title);
});

test("vi product description says which payments are still unpaid within 120-160 chars", () => {
  // Copy v1 2026-11-23: "khoản nào chưa thu" (which payment is not yet collected)
  // replaces "khoản tiền chưa thu"; both name the unpaid payment, never "tiền phòng".
  const { description } = PRODUCT_META.sotro.vi;
  assert.ok(description.includes("khoản nào chưa thu"));
  assert.ok(!description.includes("tiền phòng chưa thu"));
  const length = [...description].length;
  assert.ok(length >= 120 && length <= 160, `length ${length}`);
});

// v8 W3: the two numbered card grids ("What it's for" + "What we're building")
// became one "What it does" list; the shared scope heading stays defined for
// other surfaces but no longer appears on a product profile.
const profileDropsScopeHeading = (src) =>
  !src.includes("SHARED_LABELS.scopeHeading") &&
  src.includes("PAGE_LABELS.whatItDoes[lang]") &&
  !/Development focus|Trọng tâm phát triển|开发重点|開發重點/.test(src);

test("product profile renders one 'What it does' list instead of two headings", () => {
  assert.equal(SHARED_LABELS.scopeHeading.en, "What we're building");
  assert.equal(SHARED_LABELS.scopeHeading.vi, "Đang xây dựng những gì");
  for (const lang of LANGS) {
    const src = read(`src/pages/${lang}/products/[slug].astro`);
    assert.ok(profileDropsScopeHeading(src), lang);
    // Negative proof: re-adding the scope heading is detected.
    assert.equal(
      profileDropsScopeHeading(
        `${src}\n{labelFor(SHARED_LABELS.scopeHeading, "${lang}")}`,
      ),
      false,
      lang,
    );
  }
});

const CRAFT_HEADINGS = {
  en: [
    "Why a private channel",
    "What we chose",
    "What limits it",
    "How it works",
    "What it does not do",
  ],
  vi: [
    "Vì sao cần kênh riêng tư",
    "Chúng tôi chọn gì",
    "Giới hạn",
    "Cách hoạt động",
    "Kênh này không làm gì",
  ],
  zh: ["为什么要私密渠道", "我们的选择", "限制", "如何运作", "不做什么"],
  "zh-hant": ["為什麼要私密管道", "我們的選擇", "限制", "如何運作", "不做什麼"],
};
const SECTIONS = [
  "problem",
  "designChoice",
  "constraint",
  "implementation",
  "limitations",
];

function craftHeadings(src, lang) {
  const block = src.slice(
    src.indexOf(lang === "zh-hant" ? '"zh-hant": {' : `  ${lang}: {`),
  );
  return SECTIONS.map((s) => block.match(new RegExp(`${s}: "([^"]+)"`))?.[1]);
}

test("security case-study headings follow C-36 in every locale", () => {
  const src = read("src/components/editorial/CraftStory.astro");
  for (const lang of LANGS) {
    assert.deepEqual(craftHeadings(src, lang), CRAFT_HEADINGS[lang], lang);
  }
});

test("negative proof: a reverted heading is detected", () => {
  const src = read("src/components/editorial/CraftStory.astro").replace(
    "What we chose",
    "The design choice",
  );
  assert.notDeepEqual(craftHeadings(src, "en"), CRAFT_HEADINGS.en);
});
