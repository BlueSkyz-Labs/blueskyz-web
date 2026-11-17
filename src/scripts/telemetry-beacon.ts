/**
 * Anonymous aggregate event beacon (golive analytics, Owner "đồng ý làm toàn bộ"
 * 2026-11-17). Forwards the already-sanitised `blueskyz:telemetry` events from
 * `src/lib/analytics.ts` to the same-origin counter Worker (`workers/analytics`).
 *
 * Sends only {name, lang, closed-vocabulary properties}. No cookie, storage,
 * identifier, URL, referrer or free text. Honours Do Not Track and Global
 * Privacy Control by sending nothing. Best-effort: never affects the page.
 */
const ENDPOINT = "/_e";
const LANGS = ["en", "vi", "zh", "zh-hant"];

function optedOut(): boolean {
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
  return nav.doNotTrack === "1" || nav.globalPrivacyControl === true;
}

function pageLang(): string | null {
  const first = location.pathname.split("/")[1] ?? "";
  return LANGS.includes(first) ? first : null;
}

export function initTelemetryBeacon(): void {
  if (document.documentElement.hasAttribute("data-telemetry-beacon")) return;
  document.documentElement.setAttribute("data-telemetry-beacon", "");
  document.addEventListener("blueskyz:telemetry", (event) => {
    try {
      if (optedOut()) return;
      const lang = pageLang();
      const detail = (
        event as CustomEvent<{
          name: string;
          properties: Record<string, string>;
        }>
      ).detail;
      if (!lang || !detail) return;
      const body = JSON.stringify({
        name: detail.name,
        lang,
        properties: detail.properties,
      });
      navigator.sendBeacon(ENDPOINT, new Blob([body], { type: "text/plain" }));
    } catch {
      /* best-effort */
    }
  });
}
