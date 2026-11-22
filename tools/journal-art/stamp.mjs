/**
 * The BlueSkyz Labs stamp baked into every journal image (press standard R3).
 * Three layers, all rendered into the pixels by the browser before encoding:
 *   1. a faint "© BlueSkyz Labs" micro-pattern over the whole artwork;
 *   2. the logo on a porcelain plate inside the composition;
 *   3. a visible copyright line.
 */
import { readFileSync } from "node:fs";

const LOGO = readFileSync(
  new URL(
    "../../public/brand/blueskyz/v5/logos/lockup-compact-labs-paper.svg",
    import.meta.url,
  ),
  "utf8",
).replace(/<svg /, '<svg class="stamp__logo" ');

export const RIGHTS_HOLDER = "BlueSkyz Labs";

export function copyrightLine(year) {
  return `© ${year} ${RIGHTS_HOLDER} · blueskyzlabs.com`;
}

/** The pattern tile: rotated micro-text, repeated across the image. */
function patternSvg() {
  const text = `© ${RIGHTS_HOLDER}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" class="stamp__pattern" aria-hidden="true">
  <defs><pattern id="stamp-tile" width="260" height="120" patternUnits="userSpaceOnUse" patternTransform="rotate(-24)">
    <text x="0" y="40" font-family="Inter Variable" font-size="15" font-weight="600" fill="#0b1020">${text}</text>
    <text x="130" y="100" font-family="Inter Variable" font-size="15" font-weight="600" fill="#0b1020">${text}</text>
  </pattern></defs>
  <rect width="100%" height="100%" fill="url(#stamp-tile)"/></svg>`;
}

export const STAMP_CSS = `
.stamp__pattern { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0.07; pointer-events: none; z-index: 20; }
.stamp__seal { position: absolute; z-index: 21; display: flex; align-items: center; gap: 14px;
  padding: 10px 16px 10px 12px; border-radius: 999px; background: rgba(247,248,250,0.92);
  box-shadow: 0 0 0 1px rgba(11,16,32,0.08), 0 6px 18px rgba(11,16,32,0.10); }
.stamp__logo { height: 34px; width: auto; display: block; }
.stamp__rule { width: 1px; align-self: stretch; background: rgba(11,16,32,0.18); }
.stamp__copy { font: 600 14px/1.2 "Inter Variable", sans-serif; color: #0b1020; letter-spacing: 0.01em; white-space: nowrap; }
`;

/**
 * @param {{year: number, position?: string}} opts position is a CSS inset for
 * the seal; it sits inside the artwork, never flush in a corner.
 */
export function stampHtml({
  year,
  position = "left: 50%; bottom: 7%; transform: translateX(-50%);",
}) {
  return `${patternSvg()}
<div class="stamp__seal" style="${position}">${LOGO}<span class="stamp__rule"></span><span class="stamp__copy">${copyrightLine(year)}</span></div>`;
}

/** XMP packet: IPTC/Dublin Core rights fields Google Images and editors read. */
export function xmpPacket({ year, title, webStatement }) {
  const esc = (s) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
  return `<?xpacket begin="﻿" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
 <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
  <rdf:Description rdf:about=""
    xmlns:dc="http://purl.org/dc/elements/1.1/"
    xmlns:photoshop="http://ns.adobe.com/photoshop/1.0/"
    xmlns:xmpRights="http://ns.adobe.com/xap/1.0/rights/"
    photoshop:Credit="${RIGHTS_HOLDER}"
    xmpRights:Marked="True"
    xmpRights:WebStatement="${esc(webStatement)}">
   <dc:title><rdf:Alt><rdf:li xml:lang="x-default">${esc(title)}</rdf:li></rdf:Alt></dc:title>
   <dc:creator><rdf:Seq><rdf:li>${RIGHTS_HOLDER}</rdf:li></rdf:Seq></dc:creator>
   <dc:rights><rdf:Alt><rdf:li xml:lang="x-default">© ${year} ${RIGHTS_HOLDER}. All rights reserved.</rdf:li></rdf:Alt></dc:rights>
  </rdf:Description>
 </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;
}
