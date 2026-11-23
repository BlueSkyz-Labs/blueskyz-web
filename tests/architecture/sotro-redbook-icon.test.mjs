/**
 * YENLUME product mark guard (was the Sổ Trọ red-book guard; Owner DEVIATION
 * from Brand Kit v4, 2026-10-01, renamed and re-pinned 2026-11-23).
 * Record: docs/brand/DEVIATION_SOTRO_PRODUCT_ICON_2026-10-01.md.
 *
 * The website's product mark for slug `sotro` is the YENLUME icon of the app
 * (Sotro public/icons/icon.svg) and the two endorsed lockups of brand kit
 * YENLUME 1.3 (Owner approved 2026-11-23 15:17 GMT+7). This guard (1) fails if
 * any published or built file is still a retired Sổ Trọ asset (blue house or
 * red book, by content hash and by glyph signature), (2) pins the lockups
 * byte for byte to the kit 1.3 files, and (3) pins the icon files to their
 * documented source and sizes.
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

const KIT_LOCKUPS =
  "brand/blueskyz-production-v4/06_PRODUCT_BRANDS/01_LOCKUPS_SVG";
const PRODUCTS = "public/brand/blueskyz/v4/products";

/** Kit YENLUME 1.3 endorsed lockups (en). The website copies are these bytes. */
const KIT_13_LOCKUP_SHA256 = {
  light: "6c9cae9646d655708c26c4d3bcc776b4cf04125d80a567ce074d225b129decff",
  dark: "50308c05dad2dd6c91d4e909ee44ebb349fddee9e2129b65bb8dd3505a5de29b",
};

/** sha256 of every retired Sổ Trọ asset: the blue-house Sổ Trọ asset that shipped before the decision (c518a0e). */
const OLD_BLUE_HOUSE_SHA256 = new Map([
  [
    "fddcc299444795844acc12c06fbff43947139fb0ebb97f88939661ca78585c3f",
    "products/sotro/icon.png (kit REFERENCE extraction)",
  ],
  [
    "60b6461b278537a852f10ecc5e1222b3ac3d29360350442264ba56768f9a49bf",
    "sotro.svg / products/sotro/icon.svg (kit product icon)",
  ],
  [
    "b54635276bb0da878ce42ff49bab9d1d585b01743e5797fb83da3d4f4da810d0",
    "products/sotro/identity.png (kit dark lockup PNG)",
  ],
  [
    "b839885effe4db4ac529d0f20abf0774eaf99895a4d80082b15c99f07b0a43b5",
    "sotro_endorsed_lockup_light.svg (kit)",
  ],
  [
    "51a326b0651c616083b22dbe8ab874652cbe8706d3dfe9b97b19ed342169cdd4",
    "sotro_endorsed_lockup_dark.svg (kit)",
  ],
  // 2026-11-23 (YENLUME rename, brand kit 1.3): the red-book "Sổ Trọ" set is retired too.
  [
    "974982e146e549b838e602e6c92899143aa186b33bff646e89be8dc05ac43fff",
    "retired red-book icon.svg / sotro.svg (Sổ Trọ app icon before YENLUME)",
  ],
  [
    "6320980f0409ce5aa7c12d3acc8d79a00b2cec6d31e9c01b9f12537fae1d540f",
    "retired red-book products/sotro/icon.png",
  ],
  [
    "e8254c6cd563278c89b826a25b1647bc9a35ccda30ee523cce41ae1e6edc5c2b",
    "retired red-book products/sotro/icon-112.png",
  ],
  [
    "f7b38af7bcf20cf1336e94c2e9538bfefcc8bd698fc68039f01aeff6a194b4f1",
    "retired red-book products/sotro/identity.png",
  ],
  [
    "3011e4f19dbda1ca7172d89d5cfc59e9e6c81760037ae21367d2c252aab85df8",
    "retired red-book sotro_endorsed_lockup_light.svg",
  ],
  [
    "9b4f273b2f6b3bf708b2d9bba3032c2c6af7f5561fe6a4583bc1339e3ca0daf0",
    "retired red-book sotro_endorsed_lockup_dark.svg",
  ],
]);
/** The retired red-book hashes, for the negative proof below. */
const RED_BOOK_ICON_SHA256 =
  "974982e146e549b838e602e6c92899143aa186b33bff646e89be8dc05ac43fff";
/** Path data of the kit's blue-house glyph. */
const HOUSE_SIGNATURE = "M8 29 32 9l24 20v26H8Z";
/** sha256 of the Sotro app repo public/icons/icon.svg (YENLUME icon, 2026-11-23) that the vector files copy. */
const APP_ICON_SVG_SHA256 =
  "e0d4d4823fb110cd50c5999e874f7f178388a724845a56f6262efeb8bcb3a18f";

const sha = (buffer) => createHash("sha256").update(buffer).digest("hex");

function walk(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

/** Returns "<file>: <reason>" for every blue-house Sổ Trọ asset among `files`. */
export function blueHouseOffenders(
  files,
  read = readFileSync,
  banned = OLD_BLUE_HOUSE_SHA256,
) {
  const offenders = [];
  for (const file of files) {
    if (!/sotro/i.test(file) && !/\.(png|svg)$/i.test(file)) continue;
    const bytes = read(file);
    const hit = banned.get(sha(bytes));
    if (hit) offenders.push(`${file}: identical to old ${hit}`);
    else if (
      /sotro/i.test(file) &&
      /\.svg$/i.test(file) &&
      bytes.toString("utf8").includes(HOUSE_SIGNATURE)
    ) {
      offenders.push(`${file}: contains the blue-house glyph`);
    }
  }
  return offenders;
}

function pngHeader(path) {
  const b = readFileSync(path);
  assert.equal(b.subarray(1, 4).toString(), "PNG", `${path} must be a PNG`);
  return {
    width: b.readUInt32BE(16),
    height: b.readUInt32BE(20),
    colorType: b[25],
  };
}

test("no published or built file is still a blue-house Sotro asset", () => {
  const roots = ["public", ...(existsSync("dist") ? ["dist"] : [])];
  assert.deepEqual(blueHouseOffenders(roots.flatMap(walk)), []);
});

test("no page or source references the kit's blue-house Sổ Trọ paths", () => {
  const files = [
    ...walk("src"),
    ...(existsSync("dist") ? walk("dist") : []),
  ].filter((f) => /\.(astro|ts|mjs|css|yaml|json|html)$/.test(f));
  const offenders = files.filter((f) => {
    const text = readFileSync(f, "utf8");
    return /REFERENCE_sotro|06_PRODUCT_BRANDS[^"'\s]*sotro|03_PRODUCT_ICONS[^"'\s]*sotro/.test(
      text,
    );
  });
  assert.deepEqual(offenders, []);
});

test("negative proof: the offender scan catches an old asset and a house glyph", () => {
  const kitLockup = `${KIT_LOCKUPS}/sotro_endorsed_lockup_light.svg`;
  assert.equal(
    blueHouseOffenders([kitLockup]).length,
    1,
    "old kit lockup by hash",
  );
  const mutated = () =>
    Buffer.from(`<svg><path d="${HOUSE_SIGNATURE}"/></svg>`);
  assert.equal(
    blueHouseOffenders(["public/x/sotro_new.svg"], mutated).length,
    1,
    "house glyph by signature",
  );
  assert.deepEqual(blueHouseOffenders(["public/products/sotro/icon.svg"]), []);
  // The hash path is live for every published Sổ Trọ file: pretend each current
  // file is retired and the scan must flag it; the real list must not.
  for (const file of [
    "public/products/sotro/icon.svg",
    "public/products/sotro/icon.png",
    "public/products/sotro/identity.png",
    `${PRODUCTS}/sotro_endorsed_lockup_light.svg`,
    `${PRODUCTS}/sotro_endorsed_lockup_dark.svg`,
  ]) {
    const pretend = new Map([[sha(readFileSync(file)), "pretend-retired"]]);
    assert.equal(
      blueHouseOffenders([file], readFileSync, pretend).length,
      1,
      file,
    );
    assert.deepEqual(blueHouseOffenders([file]), [], file);
  }
  // The retired red-book icon hash is on the list.
  assert.ok(OLD_BLUE_HOUSE_SHA256.has(RED_BOOK_ICON_SHA256));
});

test("vector icon files are byte copies of the Owner-approved app icon.svg", () => {
  for (const path of [
    "public/products/sotro/icon.svg",
    `${PRODUCTS}/sotro.svg`,
  ]) {
    assert.equal(sha(readFileSync(path)), APP_ICON_SVG_SHA256, path);
  }
});

test("raster icon and identity art have the documented sizes", () => {
  const icon = pngHeader("public/products/sotro/icon.png");
  assert.equal(icon.width, 256);
  assert.equal(icon.height, 256);
  // >= 2x the largest rendered icon (112 px tile with padding => 92 px content).
  assert.ok(icon.width >= 2 * 92);
  const identity = pngHeader("public/products/sotro/identity.png");
  assert.equal(identity.width, 1800);
  assert.equal(identity.height, 504);
});

test("endorsed lockups are byte copies of the kit YENLUME 1.3 files", () => {
  for (const variant of ["light", "dark"]) {
    const bytes = readFileSync(
      `${PRODUCTS}/sotro_endorsed_lockup_${variant}.svg`,
    );
    assert.equal(sha(bytes), KIT_13_LOCKUP_SHA256[variant], `${variant} pin`);
    const text = bytes.toString("utf8");
    assert.match(text, /aria-label="YENLUME by BlueSkyz Labs"/);
    assert.ok(
      !/Sổ Trọ|So Tro|SỔ TRỌ/.test(text),
      `${variant}: no Sổ Trọ label`,
    );
    assert.ok(!text.includes(HOUSE_SIGNATURE), `${variant}: no blue house`);
    assert.ok(!/bgRuby|goldLedger/.test(text), `${variant}: no red book`);
    assert.match(text, /viewBox="0 0 4883 1266"/);
  }
});

test("negative proof: the kit v4 lockup and the retired red-book lockup are refused", () => {
  const retired = [
    `${KIT_LOCKUPS}/sotro_endorsed_lockup_light.svg`,
    `${KIT_LOCKUPS}/sotro_endorsed_lockup_dark.svg`,
  ];
  for (const file of retired) {
    const bytes = readFileSync(file);
    assert.notEqual(sha(bytes), KIT_13_LOCKUP_SHA256.light, file);
    assert.notEqual(sha(bytes), KIT_13_LOCKUP_SHA256.dark, file);
    assert.equal(blueHouseOffenders([file]).length, 1, `${file} flagged`);
  }
  // The retired red-book lockups are on the hash list.
  for (const hash of [
    "3011e4f19dbda1ca7172d89d5cfc59e9e6c81760037ae21367d2c252aab85df8",
    "9b4f273b2f6b3bf708b2d9bba3032c2c6af7f5561fe6a4583bc1339e3ca0daf0",
  ]) {
    assert.ok(OLD_BLUE_HOUSE_SHA256.has(hash), hash);
  }
});

test("the other four products keep their kit marks (byte-identical product icons and lockups)", () => {
  for (const product of ["apexagent", "fluentarc", "sotam", "vungtaylai"]) {
    assert.equal(
      sha(readFileSync(`${PRODUCTS}/${product}.svg`)),
      sha(
        readFileSync(
          `brand/blueskyz-production-v4/03_ICONS/03_PRODUCT_ICONS/${product}.svg`,
        ),
      ),
      product,
    );
  }
});

test("the deviation is recorded with date, decision and reason", () => {
  const doc = readFileSync(
    "docs/brand/DEVIATION_SOTRO_PRODUCT_ICON_2026-10-01.md",
    "utf8",
  );
  for (const needle of [
    "2026-10-01",
    "Owner",
    "Brand Guidelines v4",
    "2026-08-10",
    "masterbrand",
    "2x",
    "YENLUME",
    "2026-11-23",
    KIT_13_LOCKUP_SHA256.light,
    KIT_13_LOCKUP_SHA256.dark,
  ]) {
    assert.ok(
      doc.toLowerCase().includes(needle.toLowerCase()),
      `deviation record mentions ${needle}`,
    );
  }
});
