import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

/**
 * Display type guard (Experience v6 S4; Brand Kit v5, Owner 2026-11-10).
 *
 * Display headings use the kit's display face, Noto Serif Display, at exactly
 * one weight (300). It is the ONLY second web face: two small subsets, declared
 * in global.css with a metric fallback, under a fixed byte ceiling. The display
 * token reaches ONLY h1/h2 display headings (`.type-d1`, `.type-d2`,
 * `.hero-headline`). This replaces the 2026-10-04 "calm chrome" contract
 * (Inter at 520, no second face).
 * Each blocking check is a pure function, and the negative-proof test feeds it
 * a mutated input to show it turns RED.
 */
const CSS_PATH = "src/styles/display-type.css";
const FONT_DIR = "public/fonts";
const DISPLAY_SELECTORS = [".type-d1", ".type-d2", ".hero-headline"];
const GLOBAL_CSS_PATH = "src/styles/global.css";
// The display face is instanced to one static weight; any other value makes
// the browser synthesise a bold, so the band is a single point.
const DISPLAY_WEIGHT_MIN = 300;
const DISPLAY_WEIGHT_MAX = 300;
// The brand text face plus the two display subsets, nothing else.
const ALLOWED_FONT_FILE =
  /^(inter-(latin|vietnamese)-wght-v\d+\.\d+\.\d+|noto-serif-display-(latin|vietnamese)-300-v\d+\.\d+)\.woff2$/;
const DISPLAY_FONT_FILE = /^noto-serif-display-/;
// Ceiling for the whole display face (both subsets), in bytes on disk.
const DISPLAY_FONT_BYTES_MAX = 24_000;

const read = (path) => readFileSync(path, "utf8");
const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, "");

/** Forward-slash paths so assertions are separator-independent. */
const toPosix = (path) => path.replaceAll("\\", "/");

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walk(path, out);
    else out.push(path);
  }
  return out;
}

/** One display face: the token leads with the kit serif and its fallback. */
function checkDisplayFace(css, globalCss) {
  const code = stripComments(css);
  assert.doesNotMatch(
    code,
    /@font-face/,
    "display-type.css declares no faces (they live in global.css)",
  );
  assert.doesNotMatch(code, /"Display Face"|plus-jakarta/i);
  const token = code.match(/--font-display\s*:\s*([^;]+);/)?.[1] ?? "";
  assert.match(
    token.trim(),
    /^"Noto Serif Display",\s*"Noto Serif Display Fallback",\s*"Inter Variable"/,
    "--font-display must lead with the kit serif, its metric fallback, then Inter",
  );
  const faces = (
    stripComments(globalCss).match(/@font-face\s*\{[^}]+\}/g) ?? []
  ).filter((face) => /font-family:\s*"Noto Serif Display"\s*;/.test(face));
  assert.equal(faces.length, 2, "exactly two display subsets are declared");
  for (const face of faces) {
    assert.match(face, /font-weight\s*:\s*300\s*;/, "display face is 300 only");
    assert.match(face, /font-display\s*:\s*swap\s*;/);
    assert.match(face, /unicode-range\s*:/, "display face must be subsetted");
    assert.match(
      face,
      /url\("\/fonts\/noto-serif-display-(latin|vietnamese)-300-v[\d.]+\.woff2"\)/,
      "display face must be self-hosted",
    );
  }
  const fallback = stripComments(globalCss).match(
    /@font-face\s*\{[^}]*"Noto Serif Display Fallback"[^}]*\}/,
  )?.[0];
  assert.ok(fallback, "a metric fallback for the display face is required");
  assert.match(fallback, /size-adjust\s*:/);
  assert.match(fallback, /ascent-override\s*:/);
  assert.doesNotMatch(fallback, /url\(/, "the fallback is a local face");
}

/** Only the Inter subsets and the two display subsets ship, under the ceiling. */
function checkFontFiles(names, sizeOf = () => 0) {
  const woff2 = names.filter((n) => n.endsWith(".woff2"));
  assert.ok(
    woff2.some((n) => n.startsWith("inter-")),
    "Inter subsets must be present",
  );
  for (const name of woff2) {
    assert.match(name, ALLOWED_FONT_FILE, `unexpected web font ${name}`);
  }
  const display = woff2.filter((n) => DISPLAY_FONT_FILE.test(n));
  assert.equal(display.length, 2, "the display face ships as two subsets");
  const bytes = display.reduce((sum, name) => sum + sizeOf(name), 0);
  assert.ok(
    bytes <= DISPLAY_FONT_BYTES_MAX,
    `display face is ${bytes} B, over ${DISPLAY_FONT_BYTES_MAX} B`,
  );
}

/** Display rules use the weight token, and the token sits in the quiet band. */
function checkDisplayWeight(css) {
  const code = stripComments(css);
  const value = Number(code.match(/--display-weight\s*:\s*(\d+)\s*;/)?.[1]);
  assert.ok(Number.isFinite(value), "--display-weight token is required");
  assert.ok(
    value >= DISPLAY_WEIGHT_MIN && value <= DISPLAY_WEIGHT_MAX,
    `--display-weight ${value} outside ${DISPLAY_WEIGHT_MIN}-${DISPLAY_WEIGHT_MAX}`,
  );
  const rule =
    code.match(
      /\.type-d1,\s*\.type-d2,\s*\.hero-headline\s*\{([^}]*)\}/,
    )?.[1] ?? "";
  assert.match(rule, /font-family\s*:\s*var\(--font-display\)/);
  assert.match(rule, /font-weight\s*:\s*var\(--display-weight\)/);
}

// Every rule that sets font-family: var(--font-display*) must be scoped to the
// display selectors only (never body, h3+, p, eyebrow, button...).
function checkDisplayScope(css) {
  const stripped = stripComments(css);
  const rules = [
    ...stripped.matchAll(/([^{}@]+)\{([^{}]*font-family\s*:[^{}]*)\}/g),
  ];
  assert.ok(rules.length > 0, "display rules not found");
  for (const [, selectorList, body] of rules) {
    if (!/var\(--font-display/.test(body)) continue;
    const flat = selectorList
      .replace(/:lang\([^)]*\)/g, " ")
      .replace(/:is\(|\)/g, " ");
    for (const selector of flat.split(/[\s,]+/).filter(Boolean)) {
      assert.ok(
        DISPLAY_SELECTORS.includes(selector),
        `display face leaked to "${selector}"`,
      );
    }
  }
}

function checkNoOtherUsage(files) {
  for (const [path, text] of files) {
    if (toPosix(path) === CSS_PATH) continue;
    assert.doesNotMatch(
      text,
      /--font-display|--display-weight|"Display Face"|plus-jakarta/,
      `${path} must not reference the display token directly`,
    );
  }
}

function checkHeadingOnly(files) {
  for (const [path, text] of files) {
    for (const tag of text.match(/<[a-zA-Z][\w-]*\b[^>]*>/g) ?? []) {
      if (!/\btype-d[12]\b/.test(tag)) continue;
      assert.match(tag, /^<h[12]\b/, `${path}: display class on ${tag}`);
    }
  }
}

function checkNoCulturalNames(css) {
  assert.doesNotMatch(
    stripComments(css),
    /son-mai|lacquer|chu-dau|dong-ho|maison/i,
  );
}

/** The engine-gated preload carries Inter and the display face, never CJK. */
function checkPreload(layoutSrc, bootstrap) {
  assert.doesNotMatch(
    layoutSrc,
    /\.woff2/,
    "font preloads live in theme-init.js (engine-aware), not in the HTML",
  );
  assert.match(bootstrap, /AppleWebKit/, "preload must stay engine-gated");
  assert.ok(
    bootstrap.includes("inter-${subset}-wght-v5.3.0"),
    "Inter preload must remain",
  );
  assert.ok(
    bootstrap.includes("noto-serif-display-${subset}-300-v2.003"),
    "display face preload must remain (hero H1 is the LCP element)",
  );
  assert.match(
    bootstrap,
    /if \(!lang\.startsWith\("zh"\)\)/,
    "Chinese pages must not preload the display face",
  );
  assert.doesNotMatch(bootstrap, /plus-jakarta|Display Face/);
}

const css = read(CSS_PATH);
const globalCss = read(GLOBAL_CSS_PATH);
const sources = walk("src")
  .filter((p) => /\.(astro|css|ts|mjs)$/.test(p))
  .map((p) => [p, read(p)]);
const templates = sources.filter(([p]) => p.endsWith(".astro"));
const fontNames = readdirSync(FONT_DIR);
const fontSize = (name) => statSync(join(FONT_DIR, name)).size;

test("display type uses the kit serif with a metric fallback", () => {
  checkDisplayFace(css, globalCss);
});

test("only Inter and the two display subsets ship, under the byte ceiling", () => {
  checkFontFiles(fontNames, fontSize);
});

test("display weight is a token pinned to the one shipped weight", () => {
  checkDisplayWeight(css);
});

test("display token is applied to h1/h2 display headings only", () => {
  checkDisplayScope(css);
  checkNoOtherUsage(sources);
  checkHeadingOnly(templates);
  checkNoCulturalNames(css);
});

// Windows regression pin: walk() yields OS-native separators, so the
// allowlisted stylesheet must still be skipped after normalization, and a
// non-allowlisted file that references the token must still fail.
test("display-token usage guard is separator-independent", () => {
  checkNoOtherUsage([
    ["src\\styles\\display-type.css", "a{font-family:var(--font-display)}"],
  ]);
  assert.throws(() =>
    checkNoOtherUsage([
      ["src\\styles\\other.css", "a{font-family:var(--font-display)}"],
    ]),
  );
});

test("font preload stays engine-gated and display type never reaches CJK", () => {
  checkPreload(
    read("src/layouts/BaseLayout.astro"),
    read("public/theme-init.js"),
  );
  const cjk = stripComments(css).match(/:lang\(zh\)[^{]*\{[^}]*\}/)?.[0] ?? "";
  assert.match(cjk, /font-family\s*:\s*var\(--font-display-cjk\)/);
  assert.match(cjk, /line-break\s*:\s*strict/);
  assert.doesNotMatch(cjk, /break-all/);
});

/** zh-Hant display headings list Traditional (TC) families before any SC one. */
function checkHantDisplayOrder(source) {
  const code = stripComments(source);
  const token =
    code.match(
      /:lang\(zh-Hant\)\s*\{[^}]*--font-display-cjk\s*:\s*([^;]+);/,
    )?.[1] ?? "";
  assert.ok(token, "a :lang(zh-Hant) --font-display-cjk override is required");
  const families = token.split(",").map((f) => f.trim().replace(/"/g, ""));
  const firstTc = families.findIndex((f) => /\bTC\b|CNS|JhengHei/.test(f));
  assert.ok(firstTc >= 0, "zh-Hant stack needs a Traditional family");
  const firstSc = families.findIndex((f) =>
    /\bSC\b|YaHei|Hiragino Sans GB/.test(f),
  );
  assert.ok(
    firstSc === -1 || firstTc < firstSc,
    "zh-Hant must list TC families before any SC family",
  );
}

test("zh-Hant display CJK stack is Traditional-first (A4)", () => {
  checkHantDisplayOrder(css);
  assert.throws(() =>
    checkHantDisplayOrder(
      css.replace(
        /(:lang\(zh-Hant\)\s*\{[^}]*"Inter Fallback",)/,
        '$1 "PingFang SC",',
      ),
    ),
  );
  assert.throws(() =>
    checkHantDisplayOrder(css.replace(/:lang\(zh-Hant\)\s*\{/, ":lang(xx) {")),
  );
});

test("negative proof: each blocking check turns RED on a broken invariant", () => {
  const boot = read("public/theme-init.js");
  const layoutSrc = read("src/layouts/BaseLayout.astro");
  // Inter or display preload removed, a retired face re-added, the engine
  // gate dropped, or the display face preloaded on Chinese pages.
  assert.throws(() =>
    checkPreload(layoutSrc, boot.replaceAll("inter-${subset}", "x-${subset}")),
  );
  assert.throws(() =>
    checkPreload(
      layoutSrc,
      `${boot}\npreload("/fonts/plus-jakarta-sans-latin-700.woff2")`,
    ),
  );
  assert.throws(() =>
    checkPreload(layoutSrc, boot.replaceAll("AppleWebKit", "Gecko")),
  );
  assert.throws(() =>
    checkPreload(
      layoutSrc,
      boot.replaceAll("noto-serif-display-${subset}", "x-${subset}"),
    ),
  );
  assert.throws(() =>
    checkPreload(
      layoutSrc,
      boot.replace('if (!lang.startsWith("zh"))', "if (true)"),
    ),
  );
  // A face declared in display-type.css, the token pointed away from the kit
  // serif, a third display subset, another weight, a remote URL, or no fallback.
  assert.throws(() =>
    checkDisplayFace(
      `${css}\n@font-face{font-family:"Display Face";src:url(/fonts/x.woff2)}`,
      globalCss,
    ),
  );
  assert.throws(() =>
    checkDisplayFace(
      css.replace(
        '"Noto Serif Display", "Noto Serif Display Fallback",',
        '"Other Face",',
      ),
      globalCss,
    ),
  );
  assert.throws(() =>
    checkDisplayFace(
      css,
      `${globalCss}\n@font-face { font-family: "Noto Serif Display"; font-weight: 300; font-display: swap; unicode-range: U+0041; src: url("/fonts/noto-serif-display-latin-300-v2.003.woff2"); }`,
    ),
  );
  assert.throws(() =>
    checkDisplayFace(
      css,
      globalCss.replace(
        /(font-family: "Noto Serif Display";[^}]*?)font-weight: 300;/,
        "$1font-weight: 100 900;",
      ),
    ),
  );
  assert.throws(() =>
    checkDisplayFace(
      css,
      globalCss.replace(
        'url("/fonts/noto-serif-display-latin-300-v2.003.woff2")',
        'url("https://fonts.example/noto.woff2")',
      ),
    ),
  );
  assert.throws(() =>
    checkDisplayFace(
      css,
      globalCss.replaceAll("Noto Serif Display Fallback", "Removed Fallback"),
    ),
  );
  // An extra font file shipped, a display subset missing, or the face too heavy.
  assert.throws(() =>
    checkFontFiles(
      [...fontNames, "plus-jakarta-sans-latin-700-v5.3.0.woff2"],
      fontSize,
    ),
  );
  assert.throws(() =>
    checkFontFiles(
      fontNames.filter((n) => !n.includes("display-vietnamese")),
      fontSize,
    ),
  );
  assert.throws(() => checkFontFiles(fontNames, () => 20_000));
  // Heavy display weight, missing token, or a literal weight on the display rule.
  assert.throws(() =>
    checkDisplayWeight(
      css.replace(/--display-weight:\s*\d+;/, "--display-weight: 700;"),
    ),
  );
  assert.throws(() =>
    checkDisplayWeight(
      css.replace(/--display-weight:\s*\d+;/, "--display-weight: 400;"),
    ),
  );
  assert.throws(() =>
    checkDisplayWeight(css.replace(/--display-weight:\s*\d+;/, "")),
  );
  assert.throws(() =>
    checkDisplayWeight(
      css.replace("font-weight: var(--display-weight);", "font-weight: 700;"),
    ),
  );
  // Display token leaking into body text.
  assert.throws(() =>
    checkDisplayScope(`${css}\nbody { font-family: var(--font-display); }`),
  );
  assert.throws(() =>
    checkDisplayScope(`${css}\nh3 { font-family: var(--font-display); }`),
  );
  // Another stylesheet or template using the token directly.
  assert.throws(() =>
    checkNoOtherUsage([
      ...sources,
      ["src/x.css", "p{font-weight:var(--display-weight)}"],
    ]),
  );
  // Display class on a paragraph.
  assert.throws(() =>
    checkHeadingOnly([["x.astro", '<p class="type-d2 mt-3">x</p>']]),
  );
  // Cultural token naming.
  assert.throws(() => checkNoCulturalNames(`${css}\n.son-mai-heading{}`));
});
