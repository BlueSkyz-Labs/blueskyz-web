import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const beacon = readFileSync("src/scripts/telemetry-beacon.ts", "utf8");
const worker = readFileSync("workers/analytics/src/index.js", "utf8")
  .replace(/\/\/.*$/gm, "")
  .replace(/\/\*[\s\S]*?\*\//g, "");
const headers = readFileSync("public/_headers", "utf8");
const lib = readFileSync("src/lib/analytics.ts", "utf8");

/** Returns the list of problems found in a beacon source. */
export function beaconProblems(src) {
  const out = [];
  for (const bad of [
    "localStorage",
    "sessionStorage",
    "document.cookie",
    "indexedDB",
    "location.href",
    "location.search",
    "document.referrer",
    "fetch(",
  ]) {
    if (src.includes(bad)) out.push(`uses ${bad}`);
  }
  if (!/doNotTrack/.test(src) || !/globalPrivacyControl/.test(src))
    out.push("does not honour DNT/GPC");
  if (!/const ENDPOINT = "\/_e"/.test(src))
    out.push("endpoint is not same-origin /_e");
  return out;
}

test("beacon is same-origin, storage-free and honours DNT/GPC", () => {
  assert.deepEqual(beaconProblems(beacon), []);
});

test("negative proof: a beacon that stores, tracks or goes cross-origin is flagged", () => {
  assert.ok(beaconProblems(beacon + "\nlocalStorage.setItem('id','1')").length);
  assert.ok(beaconProblems(beacon + "\ndocument.referrer").length);
  assert.ok(
    beaconProblems(beacon.replaceAll("globalPrivacyControl", "x")).length,
  );
  assert.ok(
    beaconProblems(beacon.replace('"/_e"', '"https://x.example/e"')).length,
  );
});

test("the counter Worker reads no identifying request data", () => {
  for (const bad of [
    "cf-connecting-ip",
    "user-agent",
    "cookie",
    "referer",
    "request.cf",
  ]) {
    assert.ok(
      !worker.toLowerCase().includes(bad),
      `worker must not read ${bad}`,
    );
  }
  assert.match(worker, /writeDataPoint/);
});

test("same-origin beacon needs no CSP widening", () => {
  assert.match(headers, /connect-src 'self';/);
});

test("analytics.ts itself still never transmits", () => {
  assert.ok(!lib.includes("sendBeacon") && !lib.includes("fetch("));
});
