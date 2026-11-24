/**
 * Theme switcher guard (shared header-control family).
 *
 * Owner decisions 2026-10-04 (icon-only trigger) and 2026-10-05 (ONE icon,
 * portfolio-wide, SGPS-DEC-2026-037 HC-7):
 *   - control = the search button's 44px square (hc-trigger hc-trigger--icon)
 *     in the header AND the compact menu; no visible text label in the
 *     trigger, no chevron, no native title; accessible name "<label>: <mode>";
 *   - no popup panel, no mode rows, no role=group: a press flips the resolved
 *     theme (nextTheme) and a press back to the OS theme returns to System;
 *   - glyph = one sun <-> moon morph (ThemeMorphIcon) showing the RESOLVED
 *     theme from CSS, a status dot only in System mode, spring-like 450-550ms
 *     motion, instant under reduced motion, system colours under forced
 *     colours; mask ids unique per rendered instance;
 *   - tooltip (header) = CSS-only, aria-hidden, after 300ms on hover and
 *     :focus-visible, naming every mode;
 *   - runtime = applyTheme/initTheme/nextTheme; System clears the stored key.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { applyTheme, nextTheme } from "../../src/lib/theme.ts";

const SOURCE = readFileSync("src/components/layout/ThemeToggle.astro", "utf8");
// Trigger styling lives in the shared header-control family.
const SHARED = readFileSync("src/components/layout/header-control.css", "utf8");
// The sun <-> moon glyph.
const MORPH = readFileSync(
  "src/components/layout/ThemeMorphIcon.astro",
  "utf8",
);

function rule(source, selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return (
    source.match(new RegExp(`(?:^|\\n)\\s*${escaped}\\s*\\{([^}]*)\\}`))?.[1] ??
    null
  );
}

/** The header trigger's markup: `<button ... data-theme-trigger ...>...</button>`. */
function triggerMarkup(source) {
  return (
    source.match(
      /<button\b(?:(?!<button\b)[\s\S])*?data-theme-trigger[\s\S]*?<\/button>/,
    )?.[0] ?? null
  );
}

/** Text a sighted user sees in the trigger once the hidden tooltip is removed. */
function visibleTriggerText(markup) {
  return markup
    .replace(/<span class="theme-tip"[\s\S]*?\)\)\}\s*<\/span>/, "")
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
    .replace(/<[^>]*>/g, "")
    .trim();
}

/** The sun <-> moon glyph: geometry, motion, dot, ids, a11y modes. */
export function auditMorph(morph) {
  const problems = [];
  // Unique mask id per rendered instance: a per-page counter, never a literal.
  if (
    !/const instance = \(Number\(locals\.themeMorphCount\) \|\| 0\) \+ 1;/.test(
      morph,
    ) ||
    !/locals\.themeMorphCount = instance;/.test(morph) ||
    !/const maskId = `theme-morph-\$\{instance\}`;/.test(morph) ||
    !/<mask\s+id=\{maskId\}/.test(morph) ||
    !/mask=\{`url\(#\$\{maskId\}\)`\}/.test(morph) ||
    /\bid="[^"]*"/.test(morph)
  ) {
    problems.push("mask ids must be unique per rendered instance");
  }
  // Sun = disc + 8 rays at the family stroke; moon = same disc + bite.
  const rays = morph.match(/class="tt-rays"[\s\S]*?d="([^"]+)"/)?.[1] ?? "";
  if (
    (rays.match(/M/g) ?? []).length !== 8 ||
    !/class="tt-rays"[\s\S]*?stroke-width="1\.75"/.test(morph) ||
    !/class="tt-core"[\s\S]*?fill="currentColor"/.test(morph) ||
    !/class="tt-bite"[^>]*fill="#000"/.test(morph)
  ) {
    problems.push("the glyph must be one disc with 8 rays and a mask bite");
  }
  const moon = morph.match(
    /\.tt-morph\[data-morph="moon"\],\s*:root\[data-theme="dark"\] \.tt-morph\[data-morph="live"\]\s*\{([^}]*)\}/,
  )?.[1];
  const osMoon = morph.match(
    /@media \(prefers-color-scheme: dark\)\s*\{\s*:root:not\(\[data-theme="light"\]\) \.tt-morph\[data-morph="live"\]\s*\{([^}]*)\}/,
  )?.[1];
  for (const block of [moon, osMoon]) {
    if (
      !block ||
      !/--tt-rays:\s*rotate\(90deg\) scale\(0\)/.test(block) ||
      !/--tt-body:[^;]*rotate\(-25deg\) scale\(1\.\d+\)/.test(block) ||
      !/--tt-bite:\s*none/.test(block)
    ) {
      problems.push(
        "the moon (fixed, pinned dark, OS dark) must turn the rays away, grow and turn the disc, slide the bite in",
      );
      break;
    }
  }
  const duration = Number(morph.match(/--tt-duration:\s*(\d+)ms/)?.[1] ?? 0);
  const spring = morph.match(
    /--tt-spring:\s*cubic-bezier\(([\d.]+), ([\d.]+), ([\d.]+), ([\d.]+)\)/,
  );
  if (
    duration < 450 ||
    duration > 550 ||
    !spring ||
    Number(spring[2]) <= 1 ||
    Number(spring[2]) > 1.6 ||
    !/\.tt-body\s*\{[^}]*transition:\s*transform var\(--tt-duration\) var\(--tt-spring\)/.test(
      morph,
    )
  ) {
    problems.push(
      "the morph must run 450-550ms on a restrained overshoot spring",
    );
  }
  // System dot: hidden by default, shown only while no theme is pinned.
  const dot = rule(morph, ".tt-morph .tt-dot");
  if (
    !/\{dot \? <circle class="tt-dot"/.test(morph) ||
    !dot ||
    !/opacity:\s*0/.test(dot) ||
    !/fill:\s*var\(--hc-accent/.test(dot) ||
    !/stroke:\s*var\(--tt-ring, var\(--hc-surface/.test(dot) ||
    !/:root:not\(\[data-theme\]\) \.tt-morph\[data-morph="live"\] \.tt-dot\s*\{\s*opacity:\s*1/.test(
      morph,
    )
  ) {
    problems.push("the status dot must show only in System mode");
  }
  if (
    !/@media \(prefers-reduced-motion: reduce\)\s*\{\s*\.tt-morph,\s*\.tt-morph \*\s*\{\s*transition:\s*none !important/.test(
      morph,
    )
  ) {
    problems.push("the morph must be instant under prefers-reduced-motion");
  }
  const forced =
    morph.match(
      /@media \(forced-colors: active\)\s*\{([\s\S]*?)\n {2}\}/,
    )?.[1] ?? "";
  if (
    !/\.tt-morph\s*\{\s*color:\s*CanvasText/.test(forced) ||
    !/\.hc-trigger \.tt-morph\s*\{\s*color:\s*ButtonText/.test(forced) ||
    !/\.tt-dot\s*\{\s*fill:\s*Highlight/.test(forced)
  ) {
    problems.push(
      "forced colours must use CanvasText/ButtonText and Highlight",
    );
  }
  if (!/aria-hidden="true"/.test(morph) || !/focusable="false"/.test(morph)) {
    problems.push("the glyph is decoration and must be aria-hidden");
  }
  return problems;
}

/** The one-icon appearance control contract. */
export function auditThemeSwitcher(source, shared = SHARED) {
  const problems = [];

  // Trigger: icon only, no label, no chevron, no native title.
  const markup = triggerMarkup(source);
  if (!markup) {
    problems.push("the trigger must be rendered");
  } else {
    if (!/<ThemeMorphIcon state="live" dot \/>/.test(markup)) {
      problems.push(
        "the trigger must render the live morph glyph with its dot",
      );
    }
    if (visibleTriggerText(markup) !== "") {
      problems.push("the trigger must not render a visible text label");
    }
    if (/chevron/.test(markup)) {
      problems.push("the trigger must not render a chevron");
    }
    if (/\stitle=/.test(markup)) {
      problems.push("the trigger must not carry a native title tooltip");
    }
    if (
      !/<span class="theme-tip" aria-hidden="true" data-theme-tip>/.test(markup)
    ) {
      problems.push("the tooltip must be inside the trigger and aria-hidden");
    }
  }
  if (
    !/const triggerName = `\$\{L\.label\}: \$\{L\[DEFAULT_MODE\]\}`/.test(
      source,
    ) ||
    !/aria-label=\{triggerName\}/.test(source) ||
    !/`\$\{trigger\.dataset\.themeLabel \?\? ""\}: \$\{names\[mode\] \?\? ""\}`/.test(
      source,
    )
  ) {
    problems.push("the trigger accessible name must state label and mode");
  }

  // One icon: no popup, no rows, no group semantics, same control in both
  // placements.
  if (
    /popover|hc-panel|theme-row|data-theme-mode|data-theme-toggle|role="group"|aria-pressed/.test(
      source,
    )
  ) {
    problems.push("the theme control is one icon: no panel, group or rows");
  }
  if ((source.match(/<button\b/g) ?? []).length !== 1) {
    problems.push("one button renders the control in every placement");
  }
  if (!/placement\?: "header" \| "menu"/.test(source)) {
    problems.push("the control must offer the header and menu placements");
  }

  // Tooltip: hidden by default, below the trigger, 300ms delay on hover
  // (pointer devices) and focus-visible.
  const tip = rule(source, ".theme-tip");
  if (
    !tip ||
    !/opacity:\s*0/.test(tip) ||
    !/visibility:\s*hidden/.test(tip) ||
    !/pointer-events:\s*none/.test(tip) ||
    !/top:\s*calc\(100% \+ 0\.5rem\)/.test(tip)
  ) {
    problems.push(
      "the tooltip must be hidden by default and sit below the trigger",
    );
  }
  const shown = [
    /@media \(hover: hover\)\s*\{\s*\.theme-trigger:hover \.theme-tip\s*\{([^}]*)\}/,
    /\n\s*\.theme-trigger:focus-visible \.theme-tip\s*\{([^}]*)\}/,
  ].map((re) => source.match(re)?.[1] ?? null);
  if (
    shown.some(
      (block) =>
        !block ||
        !/opacity:\s*1/.test(block) ||
        !/visibility:\s*visible/.test(block) ||
        !/opacity \d+ms [a-z-]+ 300ms/.test(block),
    )
  ) {
    problems.push(
      "the tooltip must show after 300ms on hover and focus-visible",
    );
  }
  for (const mode of ["light", "dark", "system"]) {
    if (!new RegExp(`\\[data-theme-tip-mode="${mode}"\\]`).test(source)) {
      problems.push("the tooltip must name every mode");
      break;
    }
  }

  // Shell: the search trigger's 44px square in the shared family.
  const square = rule(shared, ".hc-trigger--icon");
  const trigger = rule(shared, ".hc-trigger");
  if (
    !/class="theme-trigger hc-trigger hc-trigger--icon"/.test(source) ||
    !square ||
    !/width:\s*44px/.test(square) ||
    !/padding:\s*0/.test(square) ||
    !trigger ||
    !/min-width:\s*44px/.test(trigger) ||
    !/min-height:\s*44px/.test(trigger) ||
    !/border-radius:\s*var\(--radius-md\)/.test(trigger)
  ) {
    problems.push("the trigger must be the family's 44px icon square");
  }

  // Reduced motion (press feedback + tooltip here, family in the shared file).
  if (
    !/@media \(prefers-reduced-motion: reduce\)\s*\{\s*\.theme-trigger__glyph :global\(\.tt-morph\),\s*\.theme-tip\s*\{\s*transition:\s*none/.test(
      source,
    ) ||
    !/@media \(prefers-reduced-motion: reduce\)\s*\{\s*\.hc-trigger,\s*\.hc-chevron,\s*\.hc-panel,\s*\.hc-panel::backdrop,\s*\.hc-row\s*\{\s*transition:\s*none/.test(
      shared,
    )
  ) {
    problems.push("motion must be disabled under prefers-reduced-motion");
  }

  // Runtime contract: a press goes to nextTheme, then applies and repaints.
  if (
    // Plain switch, or the theme wash (Owner 2026-11-24) wrapping the same
    // two steps: the wash only decides how the switch is revealed.
    !/mode = nextTheme\(mode, osDark\.matches\);\s*(?:washTheme\(event, \(\) => \{\s*)?applyTheme\(mode\);\s*paint\(\);/.test(
      source,
    ) ||
    !/initTheme\(\)/.test(source)
  ) {
    problems.push("a press must apply nextTheme(mode, osDark) and repaint");
  }
  if (!/data-theme-trigger/.test(source)) {
    problems.push("data-theme-trigger must stay");
  }
  return problems;
}

/** One press: the opposite of the resolved theme, System when it matches the OS. */
export function auditNextTheme(next) {
  const problems = [];
  const table = [
    // [mode, osDark, expected]
    ["system", false, "dark"],
    ["system", true, "light"],
    ["dark", false, "system"],
    ["light", true, "system"],
    ["light", false, "dark"],
    ["dark", true, "light"],
  ];
  for (const [mode, osDark, expected] of table) {
    const got = next(mode, osDark);
    if (got !== expected) {
      problems.push(
        `nextTheme(${mode}, osDark=${osDark}) = ${got}, want ${expected}`,
      );
    }
  }
  return problems;
}

/** System clears the stored key; light/dark store it. */
export function auditStorage(apply) {
  const store = new Map();
  const attrs = new Map();
  globalThis.localStorage = {
    getItem: (k) => store.get(k) ?? null,
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  };
  globalThis.document = {
    documentElement: {
      setAttribute: (k, v) => attrs.set(k, v),
      removeAttribute: (k) => attrs.delete(k),
    },
  };
  const problems = [];
  try {
    apply("dark");
    if (
      store.get("blueskyz-theme") !== "dark" ||
      attrs.get("data-theme") !== "dark"
    ) {
      problems.push("dark must be stored and pinned");
    }
    apply("system");
    if (store.has("blueskyz-theme")) {
      problems.push("System must clear the stored choice");
    }
    if (attrs.has("data-theme")) problems.push("System must unpin the theme");
  } finally {
    delete globalThis.localStorage;
    delete globalThis.document;
  }
  return problems;
}

test("the appearance control is one icon in header and menu", () => {
  assert.deepEqual(auditThemeSwitcher(SOURCE), []);
});

test("the sun <-> moon glyph keeps its geometry, motion, dot and a11y modes", () => {
  assert.deepEqual(auditMorph(MORPH), []);
});

test("a press flips the resolved theme and returns to System on an OS match", () => {
  assert.deepEqual(auditNextTheme(nextTheme), []);
  assert.deepEqual(auditStorage(applyTheme), []);
});

test("CSP and Trusted Types: no inline handlers, no innerHTML", () => {
  for (const source of [SOURCE, MORPH]) {
    assert.doesNotMatch(source, /<script[^>]*\bis:inline\b/);
    assert.doesNotMatch(source, /\bon(click|toggle)\s*=/i);
    assert.doesNotMatch(source, /innerHTML|insertAdjacentHTML|set:html/);
  }
  assert.doesNotMatch(MORPH, /<script/);
});

test("palette is owned for light, explicit dark and OS dark", () => {
  assert.match(
    SHARED,
    /\.hc-trigger,\s*\.hc-panel,\s*\.hc-group\s*\{[^}]*--hc-accent:\s*#1d4ed8/,
  );
  assert.match(
    SHARED,
    /:root\[data-theme="dark"\] :is\(\.hc-trigger, \.hc-panel, \.hc-group\),[^{]*\{[^}]*--hc-accent:\s*#3b82f6/,
  );
  assert.match(
    SHARED,
    /prefers-color-scheme: dark\)\s*\{\s*:root:not\(\[data-theme="light"\]\) :is\(\.hc-trigger, \.hc-panel, \.hc-group\)/,
  );
  assert.match(SOURCE, /\{ "hc-group": inMenu \}/);
});

test("negative proof: a visible text label, a chevron or a native title in the trigger is caught", () => {
  const label = SOURCE.replace(
    /(<ThemeMorphIcon state="live" dot \/>\s*<\/span>)/,
    "$1\n    <span>{L[DEFAULT_MODE]}</span>",
  );
  assert.notEqual(label, SOURCE);
  assert.ok(
    auditThemeSwitcher(label).some((p) => p.includes("visible text label")),
  );
  const literal = SOURCE.replace(
    /(<ThemeMorphIcon state="live" dot \/>\s*<\/span>)/,
    "$1\n    Theme",
  );
  assert.notEqual(literal, SOURCE);
  assert.ok(
    auditThemeSwitcher(literal).some((p) => p.includes("visible text label")),
  );
  const chevron = SOURCE.replace(
    /(<ThemeMorphIcon state="live" dot \/>\s*<\/span>)/,
    '$1\n    <span class="hc-chevron" aria-hidden="true"></span>',
  );
  assert.notEqual(chevron, SOURCE);
  assert.ok(auditThemeSwitcher(chevron).some((p) => p.includes("chevron")));
  const title = SOURCE.replace(
    "aria-label={triggerName}",
    "aria-label={triggerName}\n    title={L.label}",
  );
  assert.notEqual(title, SOURCE);
  assert.ok(auditThemeSwitcher(title).some((p) => p.includes("native title")));
});

test("negative proof: a non-unique (literal) mask id is caught", () => {
  const fixed = MORPH.replace(
    "const maskId = `theme-morph-${instance}`;",
    'const maskId = "theme-morph";',
  );
  assert.notEqual(fixed, MORPH);
  assert.ok(auditMorph(fixed).some((p) => p.includes("unique")));
  const inline = MORPH.replace("id={maskId}", 'id="theme-bite"');
  assert.notEqual(inline, MORPH);
  assert.ok(auditMorph(inline).some((p) => p.includes("unique")));
});

test("negative proof: an announced, instant or missing tooltip mode is caught", () => {
  const announced = SOURCE.replace(
    '<span class="theme-tip" aria-hidden="true" data-theme-tip>',
    '<span class="theme-tip" data-theme-tip>',
  );
  assert.notEqual(announced, SOURCE);
  assert.ok(
    auditThemeSwitcher(announced).some((p) => p.includes("aria-hidden")),
  );
  const instant = SOURCE.replaceAll(
    "opacity 160ms ease-out 300ms",
    "opacity 160ms ease-out 0ms",
  );
  assert.notEqual(instant, SOURCE);
  assert.ok(auditThemeSwitcher(instant).some((p) => p.includes("300ms")));
  const noSystem = SOURCE.replace('[data-theme-tip-mode="system"]', "");
  assert.notEqual(noSystem, SOURCE);
  assert.ok(auditThemeSwitcher(noSystem).some((p) => p.includes("every mode")));
});

test("negative proof: a dot outside System, a lazy morph or no reduced motion is caught", () => {
  const dot = MORPH.replace(
    ':root:not([data-theme]) .tt-morph[data-morph="live"] .tt-dot',
    '.tt-morph[data-morph="live"] .tt-dot',
  );
  assert.notEqual(dot, MORPH);
  assert.ok(auditMorph(dot).some((p) => p.includes("System mode")));
  const slow = MORPH.replace("--tt-duration: 500ms", "--tt-duration: 900ms");
  assert.notEqual(slow, MORPH);
  assert.ok(auditMorph(slow).some((p) => p.includes("450-550ms")));
  const bouncy = MORPH.replace(
    "cubic-bezier(0.34, 1.32, 0.52, 1)",
    "cubic-bezier(0.34, 2.4, 0.52, 1)",
  );
  assert.notEqual(bouncy, MORPH);
  assert.ok(auditMorph(bouncy).some((p) => p.includes("spring")));
  const motion = MORPH.replace(
    /(@media \(prefers-reduced-motion: reduce\)[\s\S]*?)transition:\s*none !important;/,
    "$1transition: all 1s;",
  );
  assert.notEqual(motion, MORPH);
  assert.ok(auditMorph(motion).some((p) => p.includes("reduced-motion")));
  const osMoon = MORPH.replace(
    /(@media \(prefers-color-scheme: dark\)\s*\{\s*:root:not\(\[data-theme="light"\]\) \.tt-morph\[data-morph="live"\]\s*\{[^}]*)--tt-bite:\s*none;/,
    "$1",
  );
  assert.notEqual(osMoon, MORPH);
  assert.ok(auditMorph(osMoon).some((p) => p.includes("moon")));
  const forced = MORPH.replace("fill: Highlight;", "fill: red;");
  assert.notEqual(forced, MORPH);
  assert.ok(auditMorph(forced).some((p) => p.includes("forced colours")));
});

test("negative proof: a mode panel, rows or a second button coming back is caught", () => {
  for (const planted of [
    ' popover="auto"',
    ' role="group"',
    ' data-theme-mode="dark"',
    ' aria-pressed="true"',
  ]) {
    const mutated = SOURCE.replace(
      'class="theme-trigger hc-trigger hc-trigger--icon"',
      `class="theme-trigger hc-trigger hc-trigger--icon"${planted}`,
    );
    assert.notEqual(mutated, SOURCE);
    assert.ok(
      auditThemeSwitcher(mutated).some((p) => p.includes("one icon")),
      planted,
    );
  }
  const twoButtons = SOURCE.replace(
    "</div>\n\n<style>",
    '<button type="button">x</button></div>\n\n<style>',
  );
  assert.notEqual(twoButtons, SOURCE);
  assert.ok(
    auditThemeSwitcher(twoButtons).some((p) => p.includes("one button")),
  );
});

test("negative proof: a broken toggle or a stored System is caught", () => {
  // Always dark; never back to System; no flip from System.
  assert.notDeepEqual(
    auditNextTheme(() => "dark"),
    [],
  );
  assert.notDeepEqual(
    auditNextTheme((mode, osDark) => {
      const resolved = mode === "system" ? (osDark ? "dark" : "light") : mode;
      return resolved === "dark" ? "light" : "dark";
    }),
    [],
  );
  assert.notDeepEqual(
    auditNextTheme((mode) => mode),
    [],
  );
  // System persisted as a value instead of clearing the key.
  assert.notDeepEqual(
    auditStorage((mode) => {
      if (mode !== "system") {
        document.documentElement.setAttribute("data-theme", mode);
      } else {
        document.documentElement.removeAttribute("data-theme");
      }
      localStorage.setItem("blueskyz-theme", mode);
    }),
    [],
  );
  // The click no longer goes through nextTheme.
  const pinned = SOURCE.replace(
    "mode = nextTheme(mode, osDark.matches);",
    'mode = "dark";',
  );
  assert.notEqual(pinned, SOURCE);
  assert.ok(auditThemeSwitcher(pinned).some((p) => p.includes("nextTheme")));
});

test("negative proof: losing the icon square, the mode name or reduced motion is caught", () => {
  const wide = SOURCE.replace(
    'class="theme-trigger hc-trigger hc-trigger--icon"',
    'class="theme-trigger hc-trigger"',
  );
  assert.notEqual(wide, SOURCE);
  assert.ok(auditThemeSwitcher(wide).some((p) => p.includes("44px icon")));
  const name = SOURCE.replace(
    "const triggerName = `${L.label}: ${L[DEFAULT_MODE]}`",
    "const triggerName = `${L.label}`",
  );
  assert.notEqual(name, SOURCE);
  assert.ok(
    auditThemeSwitcher(name).some((p) => p.includes("accessible name")),
  );
  const motion = SOURCE.replace(
    /(@media \(prefers-reduced-motion: reduce\)[\s\S]*?)transition:\s*none !important;/,
    "$1transition: all 1s;",
  );
  assert.notEqual(motion, SOURCE);
  assert.ok(
    auditThemeSwitcher(motion).some((p) => p.includes("reduced-motion")),
  );
});
