import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

const css = readFileSync("src/styles/c3-craft.css", "utf8");
const globalCss = readFileSync("src/styles/global.css", "utf8");
const lockup = readFileSync("src/components/brand/BrandLockup.astro", "utf8");

export function blurSelectors(text) {
  const code = text.replace(/\/\*[\s\S]*?\*\//g, "");
  return [...code.matchAll(/([^{}]+)\{[^{}]*backdrop-filter:\s*blur/g)].map(
    (match) => match[1].trim(),
  );
}

test("header blur is supported-only with opaque accessibility fallbacks", () => {
  assert.match(
    css,
    /@supports\s*\(backdrop-filter:\s*blur\(1px\)\)[\s\S]*?\.header-glass\s*\{[^}]*backdrop-filter:\s*blur\(/,
  );
  assert.match(
    css,
    /prefers-reduced-transparency:\s*reduce[\s\S]*?\.header-glass\s*\{[^}]*backdrop-filter:\s*none/,
  );
  assert.match(
    css,
    /forced-colors:\s*active[\s\S]*?\.header-glass\s*\{[^}]*backdrop-filter:\s*none/,
  );
});

test("header is the only blur material; an unrelated card blur is detected", () => {
  const walk = (dir, acc = []) => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) walk(full, acc);
      else if (/\.(css|astro)$/.test(entry)) acc.push(full);
    }
    return acc;
  };
  const offenders = walk("src").flatMap((file) =>
    blurSelectors(readFileSync(file, "utf8"))
      .filter((selector) => selector !== ".header-glass")
      .map((selector) => `${file}: ${selector}`),
  );
  assert.deepEqual(offenders, []);
  assert.deepEqual(blurSelectors(".card { backdrop-filter: blur(8px); }"), [
    ".card",
  ]);
});

test("porcelain lockups switch to the reverse wordmark in dark themes", () => {
  assert.match(lockup, /brand-lockup--adaptive/);
  assert.match(lockup, /lockup-compact-labs-night\.svg/);
  assert.match(
    globalCss,
    /\[data-theme="dark"\][\s\S]*?brand-lockup__img--dark/,
  );
  assert.match(
    globalCss,
    /prefers-color-scheme:\s*dark[\s\S]*?brand-lockup__img--dark/,
  );
});

test("anchor targets use scroll-margin rather than global scroll-padding", () => {
  assert.match(globalCss, /scroll-margin-top:/);
  assert.doesNotMatch(globalCss, /scroll-padding(?:-top)?:/);
});
