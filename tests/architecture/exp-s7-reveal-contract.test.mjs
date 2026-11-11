/**
 * Experience v6 S7 — "Reveal" signature motion contract (VALIDATE prototype).
 * Only compositor-friendly properties animate, nothing loops, the reduced-motion
 * / forced-colors / print final-state rules exist, the motion script stays
 * <= 2 KB, and the hero headline (the LCP) is never an animation target.
 * Every blocking guard has a mutation that turns it RED.
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { brotliCompressSync } from "node:zlib";

const CSS = readFileSync("src/styles/reveal.css", "utf8");
const OBSERVER = readFileSync(
  "src/components/motion/RevealObserver.astro",
  "utf8",
);
const SAIL = readFileSync("src/components/motion/SailReveal.astro", "utf8");
const HERO = readFileSync("src/components/sections/Hero.astro", "utf8");
const ALLOWED = new Set([
  "transform",
  "opacity",
  "stroke-dashoffset",
  "clip-path",
]);
const JS_BUDGET_BYTES = 2048;

const stripComments = (text) => text.replace(/\/\*[\s\S]*?\*\//g, "");

export function keyframeProperties(css) {
  const props = new Set();
  for (const m of stripComments(css).matchAll(
    /@keyframes\s+[\w-]+\s*\{((?:[^{}]*\{[^{}]*\})*)\s*\}/g,
  )) {
    for (const d of m[1].matchAll(/([\w-]+)\s*:/g)) props.add(d[1]);
  }
  return props;
}

export function transitionProperties(css) {
  const props = new Set();
  for (const m of stripComments(css).matchAll(/transition\s*:\s*([^;]+);/g)) {
    for (const part of m[1].split(",")) {
      const name = part.trim().split(/\s+/)[0];
      if (name && name !== "none") props.add(name);
    }
  }
  return props;
}

export function disallowedAnimated(css) {
  return [...keyframeProperties(css), ...transitionProperties(css)].filter(
    (p) => !ALLOWED.has(p),
  );
}

export function forbiddenConstructs(css) {
  const body = stripComments(css);
  return ["infinite", "will-change", "backdrop-filter"].filter((k) =>
    body.includes(k),
  );
}

export function hasFinalStateRules(css) {
  const body = stripComments(css);
  const reduce = body.match(
    /@media \(prefers-reduced-motion: reduce\) \{([\s\S]*?)\n\}/,
  )?.[1];
  const forced = /@media \(forced-colors: active\)/.test(body);
  const print = /@media print/.test(body);
  return Boolean(
    reduce &&
    /animation:\s*none/.test(reduce) &&
    /transition:\s*none/.test(reduce) &&
    /stroke-dashoffset:\s*0/.test(reduce) &&
    forced &&
    print,
  );
}

export function motionOnlyWhenAllowed(css) {
  // Every animation/transition declaration sits inside a no-preference media
  // block; the default (and the no-JS state) is the final resting state.
  const body = stripComments(css);
  const outside = body
    .replace(
      /@media \(prefers-reduced-motion: no-preference\) \{[\s\S]*?\n\}\n/g,
      "",
    )
    .replace(/@media[^{]+\{[\s\S]*?\n\}\n/g, "")
    .replace(/@keyframes[\s\S]*?\n\}\n/g, "");
  return !/(^|\s)(animation|transition)\s*:/.test(outside);
}

export function jsBytes(astro) {
  const body = astro.match(/<script>([\s\S]*?)<\/script>/)?.[1] ?? "";
  return Buffer.byteLength(body.trim(), "utf8");
}

export function targetsLcp(css) {
  return /(hero-headline|hero-title|\[data-lcp\]|(^|[\s,{}>+~])h1\b)/m.test(
    stripComments(css),
  );
}

const TOKENS = {
  "--motion-instant": "90ms",
  "--motion-quick": "180ms",
  "--motion-base": "320ms",
  "--motion-reveal": "560ms",
  "--motion-draw": "900ms",
  "--motion-stagger": "70ms",
  "--ease-standard": "cubic-bezier(0.2, 0, 0, 1)",
  "--ease-emphasized": "cubic-bezier(0.16, 1, 0.3, 1)",
  "--ease-linear-draw": "cubic-bezier(0.4, 0, 0.2, 1)",
};

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

test("motion tokens from plan section 7 are defined on :root", () => {
  for (const [name, value] of Object.entries(TOKENS)) {
    assert.ok(
      CSS.includes(`${name}: ${value};`),
      `${name} must equal ${value}`,
    );
  }
  assert.doesNotMatch(
    CSS,
    /--[\w-]*(son-mai|chu-dau|lacquer|son_mai)[\w-]*\s*:/i,
    "token names are functional, never cultural",
  );
});

test("only transform, opacity, stroke-dashoffset and clip-path animate", () => {
  assert.deepEqual(disallowedAnimated(CSS), []);
  for (const p of ALLOWED) {
    if (p === "transform") continue; // permitted, not required

    assert.ok(
      keyframeProperties(CSS).has(p) || transitionProperties(CSS).has(p),
      `${p} is exercised`,
    );
  }
});

test("negative proof: a layout-affecting animated property is rejected", () => {
  const bad = `${CSS}\n@keyframes x { from { width: 0; } to { width: 10px; } }`;
  assert.deepEqual(disallowedAnimated(bad), ["width"]);
  const badTransition = `${CSS}\n.a { transition: height 1s; }`;
  assert.deepEqual(disallowedAnimated(badTransition), ["height"]);
});

test("no infinite loops, will-change or backdrop-filter in the Reveal layer", () => {
  assert.deepEqual(forbiddenConstructs(CSS), []);
  assert.deepEqual(forbiddenConstructs(SAIL), []);
  assert.deepEqual(forbiddenConstructs(`${CSS}\n.a{animation:x 1s infinite}`), [
    "infinite",
  ]);
});

test("the dead perpetual hero glow is deleted site-wide", () => {
  const files = walk("src").filter((f) => /\.(css|astro)$/.test(f));
  for (const f of files) {
    const text = readFileSync(f, "utf8");
    assert.doesNotMatch(text, /hero-glow-pulse|hero-visual-glow/, f);
  }
});

test("reduced-motion, forced-colors and print restore the final state", () => {
  assert.ok(hasFinalStateRules(CSS));
});

test("negative proof: removing the reduced-motion rule is rejected", () => {
  const mutated = CSS.replace(
    /@media \(prefers-reduced-motion: reduce\) \{[\s\S]*?\n\}\n/,
    "",
  );
  assert.equal(hasFinalStateRules(mutated), false);
});

test("motion declarations only exist inside no-preference blocks", () => {
  assert.ok(motionOnlyWhenAllowed(CSS));
  assert.equal(
    motionOnlyWhenAllowed(
      `${CSS}\n.sail-stroke { animation: sail-draw 1s; }\n`,
    ),
    false,
  );
});

test("the motion script stays within 2 KB and is the only motion script", () => {
  const bytes = jsBytes(OBSERVER);
  assert.ok(bytes > 0 && bytes <= JS_BUDGET_BYTES, `${bytes} B`);
  const brotli = brotliCompressSync(
    Buffer.from(OBSERVER.match(/<script>([\s\S]*?)<\/script>/)[1]),
  ).length;
  assert.ok(brotli <= JS_BUDGET_BYTES, `${brotli} B brotli`);
  assert.doesNotMatch(SAIL, /<script/);
  assert.doesNotMatch(OBSERVER, /requestAnimationFrame|setInterval|setTimeout/);
});

/** Class selectors the motion script queries (querySelector/All/closest). */
export function queriedClasses(astro) {
  const body = astro.match(/<script>([\s\S]*?)<\/script>/)?.[1] ?? "";
  return [
    ...body.matchAll(
      /(?:querySelector(?:All)?|closest|matches)(?:<[^>]*>)?\(\s*["'`]([^"'`]+)["'`]/g,
    ),
  ].flatMap((m) => [...m[1].matchAll(/\.([A-Za-z_][\w-]*)/g)].map((c) => c[1]));
}

/** Queried classes that no rendered source (.astro/.ts/.md*) ever emits. */
export function orphanTargets(astro, sources) {
  return queriedClasses(astro).filter(
    (cls) =>
      !sources.some((text) =>
        new RegExp(`(?<![\\w-])${cls}(?![\\w-])`).test(text),
      ),
  );
}

const RENDER_SOURCES = () =>
  walk("src")
    .filter(
      (f) =>
        /\.(astro|tsx?|mdx?)$/.test(f) &&
        !f.endsWith("components/motion/RevealObserver.astro"),
    )
    .map((f) => readFileSync(f, "utf8"));

test("every reveal branch in the motion script has a rendered target", () => {
  assert.deepEqual(orphanTargets(OBSERVER, RENDER_SOURCES()), []);
});

test("the removed reveal-plane branch stays gone (script and CSS)", () => {
  for (const [name, text] of [
    ["RevealObserver.astro", OBSERVER],
    ["reveal.css", CSS],
  ]) {
    assert.doesNotMatch(
      text,
      /reveal-planes|data-reveal-group|--reveal-i|\[data-revealed|dataset\.revealed/,
      name,
    );
  }
});

test("negative proof: a branch with no rendered target is rejected", () => {
  const withOrphan = OBSERVER.replace(
    "</script>",
    'document.querySelectorAll(".reveal-planes");</script>',
  );
  assert.deepEqual(orphanTargets(withOrphan, RENDER_SOURCES()), [
    "reveal-planes",
  ]);
  // ...and a target that IS emitted by some source is accepted.
  assert.deepEqual(
    orphanTargets(withOrphan, [
      ...RENDER_SOURCES(),
      '<div class="reveal-planes">',
    ]),
    [],
  );
});

test("negative proof: an over-budget script is rejected", () => {
  const fat = OBSERVER.replace(
    "</script>",
    `const pad = "${"x".repeat(2100)}";</script>`,
  );
  assert.ok(jsBytes(fat) > JS_BUDGET_BYTES);
});

test("the hero headline (LCP) is never an animation target", () => {
  assert.equal(targetsLcp(CSS), false);
  const h1 = HERO.match(/<h1[\s\S]*?>/)?.[0] ?? "";
  assert.ok(h1.includes('id="hero-title"'));
  assert.doesNotMatch(h1, /reveal|data-reveal|sail|data-motion/);
  // No ancestor of the H1 may animate either: the headline would move with it.
  assert.doesNotMatch(HERO, /<Reveal\b|class:list=\{\[\s*"reveal"|\breveal\b"/);
  assert.match(HERO, /<div\s+class="site-container relative grid/);
  assert.equal(targetsLcp(`${CSS}\n.hero-headline { opacity: 0; }`), true);
  assert.equal(targetsLcp(`${CSS}\nh1 { animation: a 1s; }`), true);
});

test("the motion script hides nothing, so it can never hide the LCP", () => {
  const body = OBSERVER.match(/<script>([\s\S]*?)<\/script>/)[1];
  assert.doesNotMatch(body, /\.style\b|classList|dataset\.revealed|hidden/);
  assert.match(body, /dataset\.motion\s*=\s*"on"/);
  assert.match(OBSERVER, /prefers-reduced-motion: reduce/);
});

test("at most one signature appearance per composition", () => {
  assert.equal((SAIL.match(/data-reveal="signature"/g) ?? []).length, 1);
  const users = walk("src")
    .filter((f) => f.endsWith(".astro"))
    .filter((f) => /<SailReveal\b/.test(readFileSync(f, "utf8")));
  assert.deepEqual(users, [
    join("src", "components", "sections", "Hero.astro"),
  ]);
  assert.equal((HERO.match(/<SailReveal\b/g) ?? []).length, 1);
});

test("the mark is decorative and cites its brand source", () => {
  assert.match(SAIL, /aria-hidden="true"/);
  assert.match(SAIL, /blueskyzlabs_horizontal_flat_dark\.svg/);
  assert.match(SAIL, /blueskyz-brand-kit-v5\/01_Logo\/sail-night\.svg/);
  assert.match(SAIL, /brand\/ is untouched/);
});

const DISPLAY_CSS = readFileSync("src/styles/display-type.css", "utf8");

export function hasLcpMotionLock(css) {
  const body = stripComments(css);
  const rule = body.match(
    /(\.hero-headline,\s*\.hero-headline \*,\s*\.hero-headline::before,\s*\.hero-headline::after)\s*\{([^}]*)\}/,
  )?.[2];
  return Boolean(
    rule &&
    /animation:\s*none\s*!important/.test(rule) &&
    /transition:\s*none\s*!important/.test(rule),
  );
}

test("the hero headline subtree has transitions and animations removed, not shortened", () => {
  assert.equal(hasLcpMotionLock(DISPLAY_CSS), true);
});

test("negative proof: dropping or weakening the LCP motion lock is rejected", () => {
  assert.equal(
    hasLcpMotionLock(
      DISPLAY_CSS.replace("transition: none !important;", "transition: none;"),
    ),
    false,
  );
  assert.equal(
    hasLcpMotionLock(DISPLAY_CSS.replace(".hero-headline *,", "")),
    false,
  );
  assert.equal(hasLcpMotionLock(""), false);
});
