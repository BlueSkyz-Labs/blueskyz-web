import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import worker, { validate, EVENTS } from "../src/index.js";

const mk = (body, headers = {}) =>
  new Request("https://blueskyzlabs.com/_e", {
    method: "POST",
    headers: { origin: "https://blueskyzlabs.com", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
const env = () => {
  const calls = [];
  return { calls, EVENTS: { writeDataPoint: (d) => calls.push(d) } };
};

test("event names match src/lib/analytics.ts", () => {
  const src = readFileSync(
    new URL("../../../src/lib/analytics.ts", import.meta.url),
    "utf8",
  );
  const block = /ANALYTICS_EVENTS = \[([\s\S]*?)\] as const/.exec(src)[1];
  const names = [...block.matchAll(/"([a-z_]+)"/g)].map((m) => m[1]).sort();
  assert.deepEqual(Object.keys(EVENTS).sort(), names);
});

test("accepts a valid event and writes one aggregate point", async () => {
  const e = env();
  const r = await worker.fetch(
    mk({
      name: "trust_route_opened",
      lang: "vi",
      properties: { surface: "privacy" },
    }),
    e,
  );
  assert.equal(r.status, 204);
  assert.equal(e.calls.length, 1);
  assert.deepEqual(e.calls[0].blobs, [
    "trust_route_opened",
    "vi",
    "privacy",
    "",
  ]);
  assert.equal(JSON.stringify(e.calls[0]).includes("@"), false);
});

for (const [label, body] of [
  ["unknown event", { name: "x", lang: "en" }],
  ["bad lang", { name: "command_navigator_opened", lang: "fr" }],
  [
    "free-text value",
    {
      name: "trust_route_opened",
      lang: "en",
      properties: { surface: "a@b.com" },
    },
  ],
  [
    "extra property",
    {
      name: "command_navigator_opened",
      lang: "en",
      properties: { email: "a@b.com" },
    },
  ],
  [
    "out-of-vocabulary",
    { name: "atlas_node_opened", lang: "en", properties: { kind: "secret" } },
  ],
  ["non-object", [1]],
]) {
  test(`negative: rejects ${label} and writes nothing`, async () => {
    const e = env();
    const r = await worker.fetch(mk(body), e);
    assert.equal(r.status, 400);
    assert.equal(e.calls.length, 0);
  });
}

test("negative: wrong origin, wrong method, wrong path, oversized, bad json", async () => {
  const e = env();
  assert.equal(
    (await worker.fetch(mk({}, { origin: "https://evil.example" }), e)).status,
    403,
  );
  assert.equal(
    (await worker.fetch(new Request("https://blueskyzlabs.com/_e"), e)).status,
    405,
  );
  assert.equal(
    (
      await worker.fetch(
        new Request("https://blueskyzlabs.com/x", { method: "POST" }),
        e,
      )
    ).status,
    404,
  );
  assert.equal((await worker.fetch(mk("x".repeat(600)), e)).status, 413);
  assert.equal((await worker.fetch(mk("{nope"), e)).status, 400);
  assert.equal(e.calls.length, 0);
});

test("validate never returns identifying fields", () => {
  const v = validate({
    name: "intent_selected",
    lang: "en",
    properties: { intent: "learn" },
  });
  assert.deepEqual(Object.keys(v).sort(), ["dims", "lang", "name"]);
});
