import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

/**
 * "The maker" section of a product profile (Owner decision 2026-11-23): the
 * founder is named from the author registry, no photograph is shown, and the
 * section closes with whose product it is. The website is not a payment
 * authority, so the section carries no price or plan wording.
 */
const LANGS = ["en", "vi", "zh", "zh-hant"];
const copy = readFileSync(
  "src/components/product/product-maker-copy.ts",
  "utf8",
);
const component = readFileSync(
  "src/components/product/ProductMaker.astro",
  "utf8",
);

test("every product page renders the maker section in its own language", () => {
  for (const lang of LANGS) {
    const page = readFileSync(
      `src/pages/${lang}/products/[slug].astro`,
      "utf8",
    );
    assert.ok(
      page.includes(`<ProductMaker slug={data.slug} lang="${lang}" />`),
      `${lang} product page does not render ProductMaker`,
    );
  }
});

test("the maker is named from the author registry, never as a literal", () => {
  assert.match(component, /AUTHORS\[copy\.author\]/);
  assert.match(component, /\{author\.name\}/);
  assert.match(component, /author\.role\[lang\]/);
  assert.doesNotMatch(copy, /Tony/, "the name must come from authors.ts");
  for (const lang of LANGS) {
    const key = lang.includes("-") ? `"${lang}": {` : `${lang}: {`;
    assert.ok(copy.includes(key), `missing maker copy for ${lang}`);
  }
});

test("the maker section shows no photograph and no price or plan wording", () => {
  assert.doesNotMatch(component, /<img|<Image|<picture|avatar/i);
  assert.doesNotMatch(
    copy,
    /\d+[.,]\d{3}|VND|\d\s*(đồng|đ\b)|miễn phí|\bfree\b|免费|免費|Hiên|Sân|Ngõ|Khu\b/i,
  );
});

test("the closing line names BlueSkyz Labs and links the about page", () => {
  assert.equal(copy.match(/house: ".*BlueSkyz Labs.*"/g).length, LANGS.length);
  assert.match(component, /href=\{`\/\$\{lang\}\/about\/`\}/);
  for (const lang of LANGS) {
    assert.ok(
      existsSync(`src/pages/${lang}/about/index.astro`) ||
        existsSync(`src/pages/${lang}/about.astro`),
      `no about page for ${lang}`,
    );
  }
});
