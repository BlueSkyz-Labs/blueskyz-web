import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const copy = readFileSync(
  "src/components/product/product-page-copy.ts",
  "utf8",
);
const nav = readFileSync(
  "src/components/experience/CommandNavigator.astro",
  "utf8",
);

test("public availability has its own wording in four languages", () => {
  for (const line of [
    "open to everyone",
    "đã mở cho mọi người",
    "已开放使用",
    "已開放使用",
  ]) {
    assert.ok(copy.includes(`"${line}"`), `missing: ${line}`);
  }
  assert.match(copy, /availability === "public"\s*\?\s*AVAILABILITY\.open/);
});

test("the command navigator status line picks the state by availability", () => {
  assert.match(nav, /webStateLabel\(entry\.data, lang\)/);
  // negative proof: the old fixed "preview" wording must not return
  assert.doesNotMatch(nav, /\?\s*AVAILABILITY\.preview\[lang\]/);
});
