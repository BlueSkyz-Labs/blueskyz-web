import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

// SGPS-DEC-2026-025 friction invariants (contract §3), static half.
// docs/performance/experience-performance-friction-contract.md

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, out);
    else if (/\.(astro|ts|css|mjs)$/.test(name)) out.push(path);
  }
  return out;
}

const SOURCES = walk("src").map((path) => ({
  path,
  text: readFileSync(path, "utf8"),
}));

/** Progress truth: no custom indefinite busy state anywhere in src. */
const BUSY_PATTERNS = [
  /aria-busy/,
  /role=["']progressbar["']/,
  /\bspinner\b/i,
  /@keyframes\s+[\w-]*(?:spin|rotate)[\w-]*/i,
];

export function findBusyStates(sources) {
  return sources.flatMap(({ path, text }) =>
    BUSY_PATTERNS.filter((re) => re.test(text)).map((re) => `${path}: ${re}`),
  );
}

/** Recovery: every modal dialog must be covered by an Escape e2e test. */
export const DIALOGS_WITH_ESCAPE_TEST = {
  "src/components/experience/CommandNavigator.astro":
    "tests/e2e/s-plus-command.spec.ts",
  "src/components/journal/JournalIndex.astro":
    "tests/e2e/journal-card-rail.spec.ts",
};

export function uncoveredDialogs(sources, covered, readSpec) {
  return sources
    .filter(({ path }) => path.endsWith(".astro"))
    .filter(({ text }) => /<dialog\b|role=["']dialog["']/.test(text))
    .map(({ path }) => path.replaceAll("\\", "/"))
    .filter((path) => {
      const spec = covered[path];
      return !spec || !/press\(["']Escape["']\)/.test(readSpec(spec));
    });
}

/** Motion must not delay feedback: route transitions stay short. */
export const MAX_ROUTE_TRANSITION_MS = 400;

export function routeTransitionMs(css) {
  const slow = css.match(/--motion-slow:\s*(\d+)ms/);
  const continuity = css.match(/--motion-continuity-duration:\s*([^;]+);/);
  assert.ok(slow && continuity, "motion tokens must exist");
  const value = continuity[1].trim();
  if (value === "var(--motion-slow)") return Number(slow[1]);
  const ms = value.match(/^(\d+)ms$/);
  assert.ok(ms, `unsupported continuity value ${value}`);
  return Number(ms[1]);
}

const globalCss = readFileSync("src/styles/global.css", "utf8");

test("progress truth: no custom busy state or spinner in src", () => {
  assert.deepEqual(findBusyStates(SOURCES), []);
});

test("recovery: every modal dialog has an Escape e2e test", () => {
  assert.deepEqual(
    uncoveredDialogs(SOURCES, DIALOGS_WITH_ESCAPE_TEST, (p) =>
      readFileSync(p, "utf8"),
    ),
    [],
  );
});

test("motion: the route transition stays within 400 ms and is removed under reduced motion", () => {
  assert.ok(routeTransitionMs(globalCss) <= MAX_ROUTE_TRANSITION_MS);
  assert.match(
    globalCss,
    /::view-transition-new\(root\)\s*\{\s*animation-duration:\s*var\(--motion-continuity-duration\)/,
  );
  assert.match(
    globalCss,
    /prefers-reduced-motion: reduce\)\s*\{\s*:root\s*\{[^}]*--motion-continuity-duration:\s*0ms/,
  );
  // Cross-document CSS transitions only: no script may hold navigation
  // feedback behind a scripted transition (feature detection is fine).
  assert.deepEqual(
    SOURCES.filter(({ text }) => /startViewTransition\s*\(/.test(text)).map(
      ({ path }) => path,
    ),
    [],
  );
});

test("negative proof: a spinner, an uncovered dialog and a slow transition are rejected", () => {
  assert.equal(
    findBusyStates([{ path: "x.astro", text: '<div class="spinner"></div>' }])
      .length,
    1,
  );
  assert.equal(
    findBusyStates([{ path: "x.css", text: "@keyframes spin-loop {}" }]).length,
    1,
  );
  assert.deepEqual(
    uncoveredDialogs(
      [{ path: "src/components/New.astro", text: "<dialog open></dialog>" }],
      DIALOGS_WITH_ESCAPE_TEST,
      () => "",
    ),
    ["src/components/New.astro"],
  );
  assert.deepEqual(
    uncoveredDialogs(
      [
        {
          path: "src/components/experience/CommandNavigator.astro",
          text: "<dialog>",
        },
      ],
      DIALOGS_WITH_ESCAPE_TEST,
      () => "test without the key press",
    ),
    ["src/components/experience/CommandNavigator.astro"],
  );
  const slow = globalCss.replace(
    /--motion-slow:\s*320ms/,
    "--motion-slow: 900ms",
  );
  assert.ok(routeTransitionMs(slow) > MAX_ROUTE_TRANSITION_MS);
});
