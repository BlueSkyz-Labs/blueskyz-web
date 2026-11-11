import assert from "node:assert/strict";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { inflateSync } from "node:zlib";

function paethPredictor(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

function countDarkPixelsInRgbPng(path) {
  const png = readFileSync(path);
  assert.deepEqual(
    [...png.subarray(0, 8)],
    [137, 80, 78, 71, 13, 10, 26, 10],
    "asset must remain a PNG",
  );

  let offset = 8;
  let width = 0;
  let height = 0;
  const idat = [];
  while (offset < png.length) {
    const length = png.readUInt32BE(offset);
    const type = png.toString("ascii", offset + 4, offset + 8);
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    assert.ok(dataEnd + 4 <= png.length, `invalid PNG chunk ${type}`);

    if (type === "IHDR") {
      width = png.readUInt32BE(dataStart);
      height = png.readUInt32BE(dataStart + 4);
      assert.equal(png[dataStart + 8], 8, "OG PNG must remain 8-bit");
      assert.equal(png[dataStart + 9], 2, "OG PNG must remain RGB");
      assert.equal(
        png[dataStart + 10],
        0,
        "unsupported PNG compression method",
      );
      assert.equal(png[dataStart + 11], 0, "unsupported PNG filter method");
      assert.equal(png[dataStart + 12], 0, "OG PNG must remain non-interlaced");
    } else if (type === "IDAT") {
      idat.push(png.subarray(dataStart, dataEnd));
    } else if (type === "IEND") {
      break;
    }

    offset = dataEnd + 4;
  }

  assert.ok(width > 0 && height > 0, "PNG is missing IHDR dimensions");
  assert.ok(idat.length > 0, "PNG is missing IDAT image data");

  const bytesPerPixel = 3;
  const stride = width * bytesPerPixel;
  const raw = inflateSync(Buffer.concat(idat));
  assert.equal(
    raw.length,
    height * (stride + 1),
    "unexpected PNG scanline size",
  );

  let dark = 0;
  let previous = Buffer.alloc(stride);
  let cursor = 0;
  for (let y = 0; y < height; y += 1) {
    const filter = raw[cursor];
    cursor += 1;
    const current = Buffer.alloc(stride);

    for (let x = 0; x < stride; x += 1) {
      const encoded = raw[cursor + x];
      const left = x >= bytesPerPixel ? current[x - bytesPerPixel] : 0;
      const up = previous[x];
      const upLeft = x >= bytesPerPixel ? previous[x - bytesPerPixel] : 0;
      let value;
      switch (filter) {
        case 0:
          value = encoded;
          break;
        case 1:
          value = encoded + left;
          break;
        case 2:
          value = encoded + up;
          break;
        case 3:
          value = encoded + Math.floor((left + up) / 2);
          break;
        case 4:
          value = encoded + paethPredictor(left, up, upLeft);
          break;
        default:
          assert.fail(`unsupported PNG filter ${filter}`);
      }
      current[x] = value & 0xff;
    }

    for (let x = 0; x < stride; x += bytesPerPixel) {
      if (current[x] < 40 && current[x + 1] < 40 && current[x + 2] < 50) {
        dark += 1;
      }
    }

    cursor += stride;
    previous = current;
  }

  return { dark, height, width };
}

// Brand files are copied from the committed kits (v4 product and hero art,
// v5 masterbrand), never regenerated: a generator would silently replace the
// kit Open Graph master, and a legacy tree would keep publishing superseded
// marks.
const PUBLISHED_BRAND_ROOT = "public/brand/blueskyz";
const ALLOWED_BRAND_DIRS = ["flags", "v4", "v5"];

function legacyBrandEntries(root) {
  return readdirSync(root)
    .filter((name) => !ALLOWED_BRAND_DIRS.includes(name))
    .sort();
}

test("only the v4 and v5 kit projections and flags are published as brand files", () => {
  assert.deepEqual(legacyBrandEntries(PUBLISHED_BRAND_ROOT), []);
  assert.equal(existsSync("scripts/generate-brand-assets.py"), false);
});

test("negative proof: a legacy brand tree beside the kits is reported", () => {
  const root = mkdtempSync(join(tmpdir(), "bsl-brand-"));
  try {
    for (const name of ["flags", "v4", "v5", "r4d"])
      mkdirSync(join(root, name));
    assert.deepEqual(legacyBrandEntries(root), ["r4d"]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("committed OG assets exist for masterbrand social previews", () => {
  assert.equal(existsSync("public/social/og-default.png"), true);
  assert.equal(existsSync("public/og-image.png"), false);
});

test("OG image contains the opaque night field of the v5 masterbrand", () => {
  const { dark, height, width } = countDarkPixelsInRgbPng(
    "public/social/og-default.png",
  );
  assert.deepEqual([width, height], [1200, 630]);
  assert.ok(dark > 2000, `expected v5 night field, found ${dark} dark pixels`);
});

test("the published v4 masterbrand lockups are gone (superseded by v5)", () => {
  assert.equal(existsSync("public/brand/blueskyz/v4/logos"), false);
});

test("favicon is the Brand Kit v5 web icon master", () => {
  assert.equal(existsSync("public/favicon.ico"), true);
  const bytes = readFileSync("public/favicon.ico");
  const source = readFileSync(
    "brand/blueskyz-brand-kit-v5/13_Web_Icons/favicon.ico",
  );
  assert.deepEqual(
    bytes,
    source,
    "favicon must remain byte-identical to the v5 source",
  );
});
