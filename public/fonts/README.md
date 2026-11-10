# Self-hosted brand font

Inter variable, weight axis only (wght 400-700), instanced from
`@fontsource-variable/inter@5.3.0` (`files/inter-*-opsz-normal.woff2`, the
optical-size + weight build) by `tools/instance-inter.py`: opsz pinned to 14
(the text size; display headings also use this face, see below), hinting and
gasp/STAT/MVAR dropped, cmap and layout features unchanged. Reproduce with
`pip install --user fonttools brotli` then
`python3 tools/instance-inter.py <upstream-opsz.woff2> public/fonts/inter-<subset>-wght-v5.3.0.woff2`
(upstream bytes: the previous `inter-*-opsz-v5.3.0.woff2` files at commit 2e2cfa8).
SIL Open Font License 1.1 in `OFL.txt`. `tests/architecture/inter-glyph-coverage.test.mjs`
checks built HTML against the new cmap.

| File                                 | Subset     |  Bytes | SHA-256                                                            |
| ------------------------------------ | ---------- | -----: | ------------------------------------------------------------------ |
| `inter-latin-wght-v5.3.0.woff2`      | Latin      | 34,224 | `807ac29aa1d2e3ca0e78eaf6d1962de2733deaa9069b842ee9f37a65a152a989` |
| `inter-vietnamese-wght-v5.3.0.woff2` | Vietnamese |  7,100 | `7ce9c75e40446bcb2d1cfc1ab1f22ff919ae59adfee201502d64d4f15fda93e1` |

`public/theme-init.js` preloads Inter (Latin on every locale, plus Vietnamese
on `/vi/`; about 51 KB on `/vi/`) for Chromium/Firefox only. The preload is
engine-gated because on WebKit it makes the subset download twice and would
exceed the 100 KB page font budget. Other locales request a subset
only when their text needs it. Give updated files new versioned URLs and
recompute these hashes.

## Display headings (Brand Kit v5, 2026-11-10)

Display headings (`.type-d1`, `.type-d2`, `.hero-headline` on h1/h2; never
body, never CJK) use Noto Serif Display at one static weight, 300, the Brand
Kit v5 display face. This replaces the calm-chrome setting of 2026-10-04
(Inter at 520, no second face). The files are instanced from the kit masters
in `brand/blueskyz-brand-kit-v5/03_Type/` by
`tools/instance-noto-serif-display.py` (wght pinned to 300, hinting and
gasp/STAT/MVAR dropped, cmap and layout features unchanged). SIL Open Font
License 1.1 in `brand/blueskyz-brand-kit-v5/03_Type/OFL-NotoSerifDisplay.txt`.

| File                                             | Subset     |  Bytes | SHA-256                                                            |
| ------------------------------------------------ | ---------- | -----: | ------------------------------------------------------------------ |
| `noto-serif-display-latin-300-v2.003.woff2`      | Latin      | 14,320 | `80c6ef98d9e4f1f5ddb39cbb059efe8bd33e8f804dff1d740cb31ef7b7f4e6a9` |
| `noto-serif-display-vietnamese-300-v2.003.woff2` | Vietnamese |  5,476 | `e053e76e1ac34733888b2f9e43acc46e11fddebfc5d7d9ab5ad7f86a559bbb93` |

`public/theme-init.js` preloads the display face before Inter on every locale
except Chinese (Chinese display headings use the system CJK stack). The
"Noto Serif Display Fallback" face in `src/styles/global.css` is a local serif
with `size-adjust: 113%`, so the swap does not move the heading. Guards:
`tests/architecture/display-typeface-contract.test.mjs` and
`tests/architecture/self-hosted-font-contract.test.mjs`.
