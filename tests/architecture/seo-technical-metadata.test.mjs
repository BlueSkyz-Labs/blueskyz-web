/**
 * Copy/SEO Phase 2 — technical metadata invariants.
 * Every blocking predicate has a negative proof: the protected invariant is
 * broken on purpose and the predicate must reject it.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

import {
  GUIDE_META,
  PAGE_META,
  PRODUCT_META,
} from "../../src/data/page-meta.ts";
import { SITE, getFooterLinks } from "../../src/data/site.ts";
import {
  getProductBreadcrumbTrail,
  productBreadcrumbJsonLd,
} from "../../src/lib/breadcrumbs.ts";
import {
  DEFAULT_OG_IMAGE,
  PUBLIC_STATIC_PATHS,
  productJsonLd,
  websiteJsonLd,
  organizationJsonLd,
} from "../../src/lib/seo.ts";

const LANGS = ["en", "vi", "zh", "zh-hant"];
const layout = readFileSync("src/layouts/BaseLayout.astro", "utf8");

// --- predicates -----------------------------------------------------------

/** Mirrors BaseLayout: descriptor + " | " + brand unless the brand is in it. */
const composeTitle = (title) =>
  title.includes(SITE.name) ? title : `${title} | ${SITE.name}`;

const hasSingleSeparator = (full) =>
  full.split(" | ").length === 2 && !/[·—]/.test(full);

const charCount = (text) => [...text].length;
const isLatin = (lang) => lang === "en" || lang === "vi";
const inDescriptionBand = (lang, text) => {
  const n = charCount(text);
  return isLatin(lang) ? n >= 120 && n <= 160 : n >= 40 && n <= 85;
};

const hasViewportInitialScale = (source) =>
  /<meta name="viewport" content="width=device-width, initial-scale=1" \/>/.test(
    source,
  );

const pageCallsBreadcrumb = (source) =>
  /productBreadcrumbJsonLd\(/.test(source) &&
  /"BreadcrumbList"|breadcrumbStructuredData/.test(source);

const passesOgImage = (source) => /\bogImage=/.test(source);

function allMeta() {
  const rows = [];
  for (const lang of LANGS) {
    for (const [key, meta] of Object.entries(PAGE_META[lang])) {
      rows.push([`${lang}/${key}`, lang, meta]);
    }
    for (const [slug, byLang] of Object.entries(PRODUCT_META)) {
      rows.push([`${lang}/product/${slug}`, lang, byLang[lang]]);
    }
    for (const [slug, byLang] of Object.entries(GUIDE_META)) {
      rows.push([`${lang}/guide/${slug}`, lang, byLang[lang]]);
    }
  }
  return rows;
}

// --- viewport -------------------------------------------------------------

test("BaseLayout viewport declares initial-scale=1", () => {
  assert.equal(hasViewportInitialScale(layout), true);
});

test("negative proof: a viewport without initial-scale is rejected", () => {
  const broken = layout.replace(", initial-scale=1", "");
  assert.notEqual(broken, layout);
  assert.equal(hasViewportInitialScale(broken), false);
});

// --- titles ---------------------------------------------------------------

test("the layout uses one ' | ' separator, never '·' or '—'", () => {
  assert.match(layout, /`\$\{title\} \| \$\{SITE\.name\}`/);
  assert.doesNotMatch(layout, /\$\{title\} [·—] \$\{SITE\.name\}/);
});

test("every authored title composes to a single-separator, brand-last title", () => {
  for (const [id, , meta] of allMeta()) {
    const full = composeTitle(meta.title);
    assert.equal(hasSingleSeparator(full), true, `${id}: ${full}`);
    assert.ok(full.endsWith(SITE.name) || meta.title.startsWith(SITE.name), id);
    assert.ok(meta.title.length > 0, id);
  }
});

test("Vietnamese About title uses the glossary label (v8 W7)", () => {
  assert.equal(PAGE_META.vi.about.title, "Về BlueSkyz");
});

test("home titles name the brand once and carry a descriptor", () => {
  for (const lang of LANGS) {
    const full = composeTitle(PAGE_META[lang].home.title);
    assert.equal(full.split(SITE.name).length - 1, 1, lang);
    assert.ok(full.length > SITE.name.length, lang);
  }
});

// Same-meaning Traditional conversion is fine, but a zh and zh-hant PAGE_META
// title must not be byte-identical unless the glyphs are script-neutral and
// the page is not authored here (those are reviewed from built output).
const duplicateLocaleTitles = (zh, zhHant) =>
  Object.keys(zh).filter((id) => zh[id].title === zhHant[id]?.title);

test("zh and zh-hant authored page titles are distinct", () => {
  assert.deepEqual(
    duplicateLocaleTitles(PAGE_META.zh, PAGE_META["zh-hant"]),
    [],
  );
});

test("negative proof: identical zh/zh-hant titles are detected", () => {
  const same = { home: { title: "BlueSkyz Labs | Sổ Trọ、Sổ Tâm" } };
  assert.deepEqual(duplicateLocaleTitles(same, same), ["home"]);
});

test("negative proof: mixed separators and repeated brand are rejected", () => {
  assert.equal(hasSingleSeparator("Products · BlueSkyz Labs"), false);
  assert.equal(hasSingleSeparator("Sổ Trọ — BlueSkyz Labs"), false);
  assert.equal(hasSingleSeparator("A | B | BlueSkyz Labs"), false);
  assert.equal(hasSingleSeparator("Về BlueSkyz | BlueSkyz Labs"), true);
  assert.equal("Về BlueSkyz".includes("BlueSkyz"), true);
});

// --- descriptions ---------------------------------------------------------

test("descriptions fall in their length band (EN/VI 120-160, CJK 40-85)", () => {
  for (const [id, lang, meta] of allMeta()) {
    assert.equal(
      inDescriptionBand(lang, meta.description),
      true,
      `${id}: ${charCount(meta.description)} chars`,
    );
  }
});

test("Vietnamese home description does not start in English", () => {
  const { description } = PAGE_META.vi.home;
  assert.doesNotMatch(description, /^Intelligence/);
  // Copy v1 2026-11-23: the description opens with the open product's name and
  // its Vietnamese one-line meaning, not with an English sentence.
  assert.match(description, /^YENLUME, sổ thu tiền cho người có nhà cho thuê/);
  assert.match(description, /đã mở cho mọi người/);
});

/** Stage words per language, keyed by the registry stage of a product. */
const STAGE = {
  development: {
    en: /in development/i,
    vi: /đang phát triển/i,
    zh: /开发中/,
    "zh-hant": /開發中/,
  },
  preview: {
    en: /in preview/i,
    vi: /bản xem trước/i,
    zh: /预览/,
    "zh-hant": /預覽/,
  },
  // A product open to everyone: the home description says so, and a product's
  // own description never keeps the older "preview" wording.
  open: {
    en: /is open/i,
    vi: /đã mở/i,
    zh: /已开放/,
    "zh-hant": /已開放/,
  },
};

/** "open" for an active public product, "preview" for an open preview, else "development". */
function registryStage(slug) {
  const record = readFileSync(`src/content/products/${slug}.yaml`, "utf8");
  const lifecycle = /^lifecycle:\s*(\S+)/m.exec(record)?.[1];
  const availability = /^availability:\s*(\S+)/m.exec(record)?.[1];
  if (
    ["active", "maintenance"].includes(lifecycle) &&
    availability === "public"
  )
    return "open";
  const preview =
    ["beta", "active", "maintenance"].includes(lifecycle) &&
    ["preview", "public"].includes(availability);
  return preview ? "preview" : "development";
}

/** Products whose description in `lang` does not state their registry stage. */
function missingStage(meta, lang, stages) {
  return Object.entries(stages)
    .filter(([slug, stage]) =>
      stage === "open"
        ? STAGE.preview[lang].test(meta[slug])
        : !STAGE[stage][lang].test(meta[slug]),
    )
    .map(([slug]) => slug);
}

test("product and home descriptions state each product's registry stage", () => {
  const stages = Object.fromEntries(
    Object.keys(PRODUCT_META).map((slug) => [slug, registryStage(slug)]),
  );
  for (const lang of LANGS) {
    const home = PAGE_META[lang].home.description;
    for (const stage of new Set(Object.values(stages)))
      assert.match(home, STAGE[stage][lang], `${lang} home: ${stage}`);
    const own = Object.fromEntries(
      Object.entries(PRODUCT_META).map(([slug, m]) => [
        slug,
        m[lang].description,
      ]),
    );
    assert.deepEqual(missingStage(own, lang, stages), [], lang);
  }
});

test("negative proof: a description without its product's stage is rejected", () => {
  const stages = { sotro: "preview", sotam: "development" };
  assert.deepEqual(
    missingStage(
      { sotro: "Sổ Trọ is in development.", sotam: "In development." },
      "en",
      stages,
    ),
    ["sotro"],
  );
  assert.deepEqual(
    missingStage(
      { sotro: "Bản xem trước.", sotam: "Bản xem trước." },
      "vi",
      stages,
    ),
    ["sotam"],
  );
});

test("negative proof: an open product's description that keeps the preview wording is rejected", () => {
  const stages = { sotro: "open" };
  assert.deepEqual(
    missingStage({ sotro: "YENLUME is now in preview." }, "en", stages),
    ["sotro"],
  );
  assert.deepEqual(
    missingStage({ sotro: "YENLUME đang mở bản xem trước." }, "vi", stages),
    ["sotro"],
  );
  assert.deepEqual(
    missingStage({ sotro: "YENLUME: see who still owes." }, "en", stages),
    [],
  );
});

test("negative proof: out-of-band descriptions are rejected", () => {
  assert.equal(
    inDescriptionBand(
      "en",
      "Explore BlueSkyz Labs products with truthful status.",
    ),
    false,
  );
  assert.equal(inDescriptionBand("en", "x".repeat(182)), false);
  assert.equal(inDescriptionBand("zh", "您请求的页面无法找到。"), false);
  assert.equal(inDescriptionBand("vi", "x".repeat(140)), true);
});

// --- JSON-LD --------------------------------------------------------------

test("WebSite and SoftwareApplication declare inLanguage", () => {
  assert.deepEqual(websiteJsonLd("https://blueskyzlabs.com/").inLanguage, [
    "en",
    "vi",
    "zh-Hans",
    "zh-Hant",
  ]);
  const tags = { en: "en", vi: "vi", zh: "zh-Hans", "zh-hant": "zh-Hant" };
  for (const lang of LANGS) {
    const app = productJsonLd(
      { name: "Sổ Trọ", description: "d", slug: "sotro", platforms: ["web"] },
      "https://blueskyzlabs.com",
      lang,
    );
    assert.equal(app.inLanguage, tags[lang], lang);
  }
});

test("Organization carries the square mark as logo; sameAs/contactPoint stay absent", () => {
  const org = organizationJsonLd("https://blueskyzlabs.com/");
  assert.equal(org.logo, "https://blueskyzlabs.com/icons/icon-512x512.png");
  assert.equal(
    existsSync(`public${new URL(org.logo).pathname}`),
    true,
    "logo must point at a committed public/ image",
  );
  for (const field of ["sameAs", "contactPoint"]) {
    assert.equal(field in org, false, field);
  }
  const app = productJsonLd(
    { name: "Sổ Trọ", description: "d", slug: "sotro", platforms: ["web"] },
    "https://blueskyzlabs.com",
    "en",
  );
  assert.equal("applicationCategory" in app, false);
  assert.equal(
    websiteJsonLd("https://blueskyzlabs.com/").url,
    "https://blueskyzlabs.com/",
    "WebSite.url is an Owner decision (F16) and is unchanged",
  );
});

test("negative proof: a logo that is not a committed image is rejected", () => {
  const fake = new URL(
    "/icons/does-not-exist.png",
    "https://blueskyzlabs.com/",
  );
  assert.equal(existsSync(`public${fake.pathname}`), false);
});

test("product and guide pages emit a BreadcrumbList in every locale", () => {
  for (const lang of LANGS) {
    const product = readFileSync(
      `src/pages/${lang}/products/[slug].astro`,
      "utf8",
    );
    const guide = readFileSync(
      `src/pages/${lang}/products/[slug]/guide.astro`,
      "utf8",
    );
    assert.equal(pageCallsBreadcrumb(product), true, `${lang} product`);
    assert.equal(pageCallsBreadcrumb(guide), true, `${lang} guide`);
  }
});

test("negative proof: a page without the breadcrumb call is rejected", () => {
  const source = readFileSync("src/pages/en/products/[slug].astro", "utf8");
  const broken = source.replaceAll("productBreadcrumbJsonLd(", "noop(");
  assert.equal(pageCallsBreadcrumb(broken), false);
});

test("product breadcrumb mirrors Home > Products > product (> guide)", () => {
  for (const lang of LANGS) {
    const home = getFooterLinks(lang).find(
      (item) => item.href === `/${lang}/products/`,
    );
    assert.ok(home, `${lang} footer declares the Products label`);
    const trail = getProductBreadcrumbTrail(lang, "sotro", "Sổ Trọ");
    assert.deepEqual(
      trail.map((crumb) => crumb.path),
      [`/${lang}/`, `/${lang}/products/`, `/${lang}/products/sotro/`],
    );
    assert.equal(trail[1].name, home.label);
    assert.equal(trail[2].name, "Sổ Trọ");

    const guideTrail = getProductBreadcrumbTrail(lang, "sotro", "Sổ Trọ", "G");
    assert.equal(guideTrail.length, 4);
    assert.equal(guideTrail[3].path, `/${lang}/products/sotro/guide/`);

    const ld = productBreadcrumbJsonLd(lang, "sotro", "Sổ Trọ", SITE.url);
    assert.equal(ld["@type"], "BreadcrumbList");
    assert.deepEqual(
      ld.itemListElement.map((item) => item.position),
      [1, 2, 3],
    );
    for (const item of ld.itemListElement) {
      assert.match(item.item, /^https?:\/\//);
    }
  }
});

test("the visible product breadcrumb label matches the JSON-LD label", () => {
  const expected = {
    en: "Products",
    vi: "Sản phẩm",
    zh: "产品",
    "zh-hant": "產品",
  };
  for (const lang of LANGS) {
    const source = readFileSync(
      `src/pages/${lang}/products/[slug].astro`,
      "utf8",
    );
    const trail = getProductBreadcrumbTrail(lang, "sotro", "Sổ Trọ");
    assert.equal(trail[1].name, expected[lang], lang);
    assert.ok(source.includes(expected[lang]), `${lang} visible label`);
  }
});

test("negative proof: the guide crumb appears only when a guide name is given", () => {
  assert.equal(getProductBreadcrumbTrail("en", "sotro", "Sổ Trọ").length, 3);
  assert.equal(
    getProductBreadcrumbTrail("en", "sotro", "Sổ Trọ", "Guide").length,
    4,
  );
});

// --- Open Graph image -----------------------------------------------------

test("default OG image declares width, height and alt", () => {
  assert.deepEqual(
    [DEFAULT_OG_IMAGE.width, DEFAULT_OG_IMAGE.height],
    [1200, 630],
  );
  assert.ok(DEFAULT_OG_IMAGE.alt.length > 10);
  assert.match(layout, /og:image:width/);
  assert.match(layout, /og:image:height/);
  assert.match(layout, /og:image:alt/);
});

test("the committed default card really is 1200x630", () => {
  assert.equal(existsSync("public/social/og-default.png"), true);
  const header = readFileSync("public/social/og-default.png").subarray(16, 24);
  assert.equal(header.readUInt32BE(0), DEFAULT_OG_IMAGE.width);
  assert.equal(header.readUInt32BE(4), DEFAULT_OG_IMAGE.height);
});

test("product profiles pass only their own 1200x630 card; guides pass none", () => {
  // v5 W5.1: replaces "profiles pass no ogImage". Stronger: a profile may pass
  // an ogImage only as the generated 1.91:1 card with its measured size and a
  // localized alt, never the raw (non-1.91:1) registry art.
  for (const lang of LANGS) {
    const profile = readFileSync(
      `src/pages/${lang}/products/[slug].astro`,
      "utf8",
    );
    assert.match(profile, /ogImage=\{productOgImagePath\(data\.slug\)\}/, lang);
    assert.match(profile, /ogImageSize=\{PRODUCT_OG_SIZE\}/, lang);
    assert.match(
      profile,
      new RegExp(
        `ogImageAltText=\\{productOgImageAlt\\(data\\.name, "${lang}"\\)\\}`,
      ),
      lang,
    );
    assert.doesNotMatch(profile, /ogImage=\{data\.proof\.media/, lang);
    const guide = readFileSync(
      `src/pages/${lang}/products/[slug]/guide.astro`,
      "utf8",
    );
    assert.equal(passesOgImage(guide), false, `${lang} guide`);
  }
});

test("negative proof: passing raw registry art as ogImage is detected", () => {
  const source = readFileSync("src/pages/en/products/[slug].astro", "utf8");
  const broken = source.replace(
    "ogImage={productOgImagePath(data.slug)}",
    "ogImage={data.proof.media?.src}",
  );
  assert.doesNotMatch(broken, /ogImage=\{productOgImagePath\(data\.slug\)\}/);
  assert.match(broken, /ogImage=\{data\.proof\.media/);
  const guide = readFileSync(
    "src/pages/en/products/[slug]/guide.astro",
    "utf8",
  );
  assert.equal(
    passesOgImage(guide.replace("  scene=", "  ogImage={x}\n  scene=")),
    true,
  );
});

// --- sitemap --------------------------------------------------------------

test("the retired /architecture/ page is gone from links, sitemap and source, and 301s to /verify/", () => {
  // Owner 2026-10-11: the "How this site is built" page was retired. Its
  // public-claim role lives on /verify; old URLs take one permanent hop there.
  const redirects = new Set(
    readFileSync("public/_redirects", "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim().split(/\s+/).join(" ")),
  );
  for (const lang of LANGS) {
    const footer = getFooterLinks(lang).map((item) => item.href);
    assert.ok(!footer.includes(`/${lang}/architecture/`), lang);
    assert.ok(!PUBLIC_STATIC_PATHS.includes(`/${lang}/architecture/`), lang);
    assert.ok(!existsSync(`src/pages/${lang}/architecture`), lang);
    for (const from of [`/${lang}/architecture/`, `/${lang}/architecture`]) {
      assert.ok(redirects.has(`${from} /${lang}/verify/ 301`), from);
    }
  }
});

test("sitemap never derives lastmod from build time", () => {
  // v8 W8 (SEO-10): lastmod now comes from git per route (see
  // seo-v7-technical.test.mjs); it must never be the build clock.
  const sitemap = readFileSync("src/pages/sitemap.xml.ts", "utf8");
  assert.doesNotMatch(sitemap, /new Date|Date\.now/);
  assert.match(sitemap, /lastmodForPath/);
});
