import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import type { Language } from "../data/site.ts";
import { SHARED_LABELS, labelFor } from "../data/site.ts";

/**
 * Per-product social card (plan v5 W5.1).
 *
 * Generated at build time by the static endpoint
 * `src/pages/social/products/[slug].jpg.ts` from committed, approved assets
 * only: the product's own app icon, the Brand Kit v4 reverse-white wordmark and
 * the Brand Kit v4 Sail mark, on the brand ink palette. No text is rasterized
 * (so no font determinism or localization problem: og:title carries the text),
 * no screenshot is implied (the registry holds identity art, not captures),
 * and nothing is fetched at runtime or from a third party.
 */
export const PRODUCT_OG_SIZE = { width: 1200, height: 630 } as const;
/** Hard ceiling asserted by the architecture test (bytes). */
export const PRODUCT_OG_MAX_BYTES = 150 * 1024;

export function productOgImagePath(slug: string): string {
  return `/social/products/${slug}.jpg`;
}

/** Localized alt from existing copy only: product name + the proof-art disclosure. */
export function productOgImageAlt(name: string, lang: Language): string {
  return `${name} — ${labelFor(SHARED_LABELS.proofCaption, lang)}`;
}

const PUBLIC_DIR = path.resolve(process.cwd(), "public");
const BRAND = "brand/blueskyz/v4";

const BACKGROUND_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><defs><linearGradient id="g" x1="0" y1="0" x2="0.35" y2="1"><stop offset="0" stop-color="#12182a"/><stop offset="0.42" stop-color="#0b1020"/><stop offset="1" stop-color="#070b14"/></linearGradient><radialGradient id="h" cx="0.78" cy="0.42" r="0.55"><stop offset="0" stop-color="#1d4ed8" stop-opacity="0.28"/><stop offset="1" stop-color="#1d4ed8" stop-opacity="0"/></radialGradient></defs><rect width="1200" height="630" fill="url(#g)"/><rect width="1200" height="630" fill="url(#h)"/></svg>`;

export async function renderProductOgImage(slug: string): Promise<Buffer> {
  const [icon, sail, wordmark] = await Promise.all([
    readFile(path.join(PUBLIC_DIR, "products", slug, "icon.png")),
    readFile(path.join(PUBLIC_DIR, BRAND, "hero/prismatic-r4d-mark-840.webp")),
    readFile(
      path.join(PUBLIC_DIR, "brand/blueskyz/v5/logos/lockup-labs-night.svg"),
    ),
  ]);

  const iconSize = 300;
  const iconRounded = await sharp(icon)
    .resize(iconSize, iconSize, { fit: "cover" })
    .composite([
      {
        input: Buffer.from(
          `<svg xmlns="http://www.w3.org/2000/svg" width="${iconSize}" height="${iconSize}"><rect width="${iconSize}" height="${iconSize}" rx="66" ry="66" fill="#fff"/></svg>`,
        ),
        blend: "dest-in",
      },
    ])
    .png()
    .toBuffer();

  const sailLayer = await sharp(sail)
    .resize({ height: 600, fit: "inside" })
    .png()
    .toBuffer();

  const wordmarkLayer = await sharp(wordmark, { density: 144 })
    .resize({ width: 340 })
    .png()
    .toBuffer();

  return sharp(Buffer.from(BACKGROUND_SVG))
    .composite([
      { input: sailLayer, left: 650, top: 15 },
      { input: iconRounded, left: 110, top: 165 },
      { input: wordmarkLayer, left: 104, top: 512 },
    ])
    .jpeg({ quality: 82, mozjpeg: true, chromaSubsampling: "4:2:0" })
    .toBuffer();
}
