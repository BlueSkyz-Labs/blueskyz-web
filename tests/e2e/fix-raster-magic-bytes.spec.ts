import { readdirSync, readFileSync } from "node:fs";
import { extname, join, relative } from "node:path";
import { expect, test } from "@playwright/test";

/**
 * Guard: a raster under public/ must be real binary, not base64 text
 * (#534 shipped six identity*.webp files that began "UklGR..." and rendered
 * as broken images, naturalWidth 0). Filesystem check, no browser needed.
 */

const PUBLIC = join(process.cwd(), "public");
const EXTS = new Set([".webp", ".png", ".jpg", ".jpeg", ".avif"]);

export function hasValidMagic(ext: string, b: Buffer): boolean {
  const ascii = (s: number, e: number) => b.subarray(s, e).toString("latin1");
  switch (ext) {
    case ".webp":
      return ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP";
    case ".png":
      return (
        b.length >= 8 &&
        b[0] === 0x89 &&
        ascii(1, 4) === "PNG" &&
        b[4] === 0x0d &&
        b[5] === 0x0a &&
        b[6] === 0x1a &&
        b[7] === 0x0a
      );
    case ".jpg":
    case ".jpeg":
      return b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
    case ".avif":
      return ascii(4, 8) === "ftyp" && /avif|avis/.test(ascii(8, 32));
    default:
      return false;
  }
}

function rasters(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    if (e.isDirectory()) return rasters(p);
    return EXTS.has(extname(e.name).toLowerCase()) ? [p] : [];
  });
}

test.describe("raster magic bytes", () => {
  test("every raster under public/ is binary with correct magic bytes", () => {
    const files = rasters(PUBLIC);
    expect(files.length).toBeGreaterThan(0);
    const bad = files
      .filter((f) => !hasValidMagic(extname(f).toLowerCase(), readFileSync(f)))
      .map((f) => relative(PUBLIC, f));
    expect(
      bad,
      `raster files with invalid magic bytes: ${bad.join(", ")}`,
    ).toEqual([]);
  });

  test("negative proof: base64 text of a WebP is rejected", () => {
    const real = Buffer.concat([
      Buffer.from("RIFF"),
      Buffer.from([0x1a, 0, 0, 0]),
      Buffer.from("WEBPVP8 "),
    ]);
    expect(hasValidMagic(".webp", real)).toBe(true);
    const asText = Buffer.from(real.toString("base64"), "latin1");
    expect(asText.subarray(0, 5).toString()).toBe("UklGR");
    expect(hasValidMagic(".webp", asText)).toBe(false);
    const png = Buffer.from("89504e470d0a1a0a", "hex");
    expect(hasValidMagic(".png", png)).toBe(true);
    expect(hasValidMagic(".png", Buffer.from(png.toString("base64")))).toBe(
      false,
    );
  });
});

// YENLUME (2026-11-23): the product page no longer renders the identity lockup
// as an in-page <img> (the hero shows the real app captures), so decode every
// shipped variant in the browser from that page; the lockup is still the
// identity art for metadata and the product index.
test("YENLUME identity variants decode on /en/products/sotro/", async ({
  page,
}) => {
  await page.goto("/en/products/sotro/");
  const widths = await page.evaluate(async () => {
    const out: Record<string, number> = {};
    for (const f of [
      "identity-480.webp",
      "identity-768.webp",
      "identity.webp",
      "identity.png",
    ]) {
      const im = new Image();
      im.src = `/products/sotro/${f}`;
      try {
        await im.decode();
      } catch {
        /* leave 0 */
      }
      out[f] = im.naturalWidth;
    }
    return out;
  });
  expect(widths).toEqual({
    "identity-480.webp": 480,
    "identity-768.webp": 768,
    "identity.webp": 1800,
    "identity.png": 1800,
  });
});

// /en/products/sotam/ declares its identity art only in metadata (no in-page
// <img>), so decode every shipped variant in the browser from that page.
test("sotam identity variants decode on /en/products/sotam/", async ({
  page,
}) => {
  await page.goto("/en/products/sotam/");
  const widths = await page.evaluate(async () => {
    const out: Record<string, number> = {};
    for (const f of [
      "identity-480.webp",
      "identity-768.webp",
      "identity.webp",
    ]) {
      const im = new Image();
      im.src = `/products/sotam/${f}`;
      try {
        await im.decode();
      } catch {
        /* leave 0 */
      }
      out[f] = im.naturalWidth;
    }
    return out;
  });
  expect(widths).toEqual({
    "identity-480.webp": 480,
    "identity-768.webp": 768,
    "identity.webp": 1800,
  });
});
