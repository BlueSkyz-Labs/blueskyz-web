// Anonymous aggregate event counter. Writes one data point per accepted event
// to Workers Analytics Engine. Never reads or stores: IP address, user agent,
// cookies, referrer, request URL query, or any visitor-supplied free text.
// Vocabulary mirrors src/lib/analytics.ts (guarded by test/vocabulary.test.mjs).

export const LANGS = ["en", "vi", "zh", "zh-hant"];
export const ORIGIN = "https://blueskyzlabs.com";
export const MAX_BODY_BYTES = 512;

export const EVENTS = {
  intent_selected: { intent: null },
  trust_route_opened: { surface: ["privacy", "security", "support"] },
  journey_action_opened: {
    kind: ["route"],
    destination: [
      "products",
      "decision-room",
      "about",
      "security",
      "contact",
      "support",
      "privacy",
    ],
  },
  command_navigator_opened: {},
  command_result_opened: { kind: ["route", "trust", "product", "evidence"] },
  atlas_node_opened: {
    kind: ["brand", "principle", "trust", "claim", "evidence", "product"],
  },
};

const INTENTS = /^[a-z][a-z-]{0,31}$/;

/** Return {name, lang, dims:[a,b]} for a valid event, else null. */
export function validate(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const { name, lang, properties = {} } = body;
  if (typeof name !== "string" || !Object.hasOwn(EVENTS, name)) return null;
  if (!LANGS.includes(lang)) return null;
  if (typeof properties !== "object" || properties === null) return null;
  const spec = EVENTS[name];
  const keys = Object.keys(spec);
  if (Object.keys(properties).some((k) => !keys.includes(k))) return null;
  const dims = [];
  for (const k of keys) {
    const v = properties[k];
    if (v === undefined) {
      dims.push("");
      continue;
    }
    if (typeof v !== "string") return null;
    const allowed = spec[k];
    if (allowed === null ? !INTENTS.test(v) : !allowed.includes(v)) return null;
    dims.push(v);
  }
  while (dims.length < 2) dims.push("");
  return { name, lang, dims };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== "/_e") return new Response(null, { status: 404 });
    if (request.method !== "POST") {
      return new Response(null, { status: 405, headers: { allow: "POST" } });
    }
    if (request.headers.get("origin") !== ORIGIN) {
      return new Response(null, { status: 403 });
    }
    const declared = Number(request.headers.get("content-length") ?? 0);
    if (declared > MAX_BODY_BYTES) return new Response(null, { status: 413 });
    let text;
    try {
      text = await request.text();
    } catch {
      return new Response(null, { status: 400 });
    }
    if (text.length > MAX_BODY_BYTES)
      return new Response(null, { status: 413 });
    let body;
    try {
      body = JSON.parse(text);
    } catch {
      return new Response(null, { status: 400 });
    }
    const event = validate(body);
    if (!event) return new Response(null, { status: 400 });
    // Day bucket (UTC date) is the only index; no per-visitor identifier.
    const day = new Date().toISOString().slice(0, 10);
    env.EVENTS?.writeDataPoint({
      indexes: [day],
      blobs: [event.name, event.lang, event.dims[0], event.dims[1]],
      doubles: [1],
    });
    return new Response(null, { status: 204 });
  },
};
