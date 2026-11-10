# BlueSkyz Brand Kit v5 (website subset)

"House of BlueSkyz. One sky. Many worlds." Approved by the Owner on 2026-11-10.

This folder is the part of the kit the website publishes. The full kit (logo
and five emblems, colour, type, pattern, Zeni, motion and sound, social, store,
print, screen, brand book) is kept unpacked in the Owner's Google Drive folder
`BlueSkyz_Brand_Kit_v5`, with its own `00_READ_FIRST.md` and `asset-index.json`.

| Folder         | What it holds                                                                                                                                           | Published as                                    |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| `01_Logo`      | Labs lockups (horizontal, stacked, compact), Labs emblem, the sail on night, on paper and in one colour                                                  | `public/brand/blueskyz/v5/logos/`               |
| `02_Colour`    | `tokens.css`, `tokens.json`                                                                                                                             | values carried in `src/styles/global.css`       |
| `03_Type`      | Noto Serif Display variable masters (Latin, Vietnamese) and the SIL OFL 1.1 licence                                                                     | instanced to `public/fonts/noto-serif-display-*` |
| `07_Social`    | Link preview 1200x630 (PNG, WebP, AVIF)                                                                                                                 | `public/social/og-default.*`                    |
| `13_Web_Icons` | favicon (SVG, ICO), PWA, Apple, maskable and tile icons, pinned-tab mask, web manifest, browserconfig                                                    | `public/icons/` and the root copies             |

Rules the website follows:

- The mark is the flat three-facet sail. Above 40 px it sits in a hairline
  ring; below 40 px the ring is dropped (`lockup-compact-labs-*`, used in the
  header, footer and language gateway).
- Display headings are set in Noto Serif Display at weight 300. Body and
  interface text stay Inter.
- Colours: Night `#05070B`, Ink `#0B1020`, Porcelain `#F7F8FA`, Mist `#CBD5E1`,
  Cobalt `#2564FF`, Cobalt Sky `#8EA8FF`, Champagne `#D9C08C`.
- Files here are copied from the kit, never redrawn. Vector files carry no
  embedded metadata. `tests/architecture/brand-kit-v5-fidelity.test.mjs` keeps
  every published file byte-identical to this folder.

Product marks, hero art, principle icons and the token projection still come
from `brand/blueskyz-production-v4`.
