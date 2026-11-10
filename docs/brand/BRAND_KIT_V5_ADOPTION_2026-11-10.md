# Brand Kit v5 adoption on the website (2026-11-10)

The Owner approved Brand Kit v5 ("House of BlueSkyz. One sky. Many worlds.")
on 2026-11-10 and asked for it to be applied to every project. This note
records what the website took from the kit, what it left on Production v4, and
which earlier decision it replaces.

## What changed

| Surface                          | Before (Production v4)                        | Now (Brand Kit v5)                                                            |
| -------------------------------- | --------------------------------------------- | ----------------------------------------------------------------------------- |
| Header, footer, language gateway | Horizontal lockup, 160 x 50, "LABS" near 6 px | Compact lockup (sail, serif wordmark, descriptor), 206 x 34, "LABS" near 8 px |
| Product share images             | v4 reverse lockup                             | v5 Labs lockup with the hairline ring                                         |
| Favicon, PWA, Apple, tile icons  | Ink square, tinted sail                       | Night square, flat three-facet sail (28 files)                                |
| Default share image              | v4 Open Graph card                            | v5 link preview, 1200 x 630 (PNG, WebP, AVIF)                                 |
| Display headings (h1, h2)        | Inter at weight 520                           | Noto Serif Display at weight 300                                              |

Unchanged: the sail geometry (the three paths are identical in v4 and v5),
the brand colours in `src/styles/global.css` (Ink, Porcelain, Cobalt already
match the kit), product marks and product lockups, principle icons, hero art
and the v4 token projection. Chinese pages keep the system CJK stack for
display headings.

## Decision this replaces

On 2026-10-04 ("calm chrome") the Owner retired the second display face so the
site shipped one family and no extra font bytes. Brand Kit v5 makes the serif
the signature of the house, so display headings load a second face again. The
cost was kept small on purpose:

- one static weight (300), Latin 14,320 B and Vietnamese 5,476 B;
- applied to h1 and h2 display headings only, never to body or interface text;
- `/en/` loads 48.5 KB of fonts and `/vi/` 61.1 KB, under the 70 KB (71,680 B)
  route budget in `performance-budget.json`;
- a metric-matched local fallback (`size-adjust: 113%`) and an engine-aware
  preload, so the hero heading does not shift when the face arrives.

## Guards

- `tests/architecture/brand-kit-v5-fidelity.test.mjs` (new): every published
  v5 file is byte-identical to `brand/blueskyz-brand-kit-v5`, the icon set is
  complete, vectors carry no metadata, scripts or remote references.
- `tests/architecture/display-typeface-contract.test.mjs`: the display token
  leads with the kit serif and its fallback, exactly two display subsets ship
  under 24,000 B, the weight token is pinned to 300, the preload stays
  engine-gated and never fires on Chinese pages.
- `tests/architecture/brand-kit-v4-fidelity.test.mjs`: still pins hero art,
  principle icons, product marks and tokens to the v4 mirror.

## Security Decision Note

- Assets: public static brand files (SVG, PNG, ICO, WOFF2). No secret, no
  visitor data, no executable content.
- Foothold: a tampered SVG or font committed under `public/`.
- Attack chain: a vector with a script or a remote reference would run or call
  out from the site origin.
- Break-chain controls: the fidelity guard rejects `<script>`,
  `<foreignObject>`, `<metadata>` and any non-fragment `href` or `src` in kit
  vectors; lockups are loaded through `<img>`, which never runs script; fonts
  are self-hosted and the CSP stays `self`; `brand/` and `tests/architecture/`
  are protected paths, so this change needs the Owner's label.
- Residual risk: low. The kit subset in the repository is a copy; the full kit
  lives in the Owner's Drive folder.
- Recovery: revert the pull request; the v4 masters are still in
  `brand/blueskyz-production-v4`.
- Evidence: architecture guards, browser checks and the measured font bytes
  above.
- Accountable Owner: Tony.

## Not done here

- Visual baselines in `tests/visual/` change on every route and are
  regenerated from the Linux CI run of this pull request.
- The hero's raster sail (`prismatic-r4d-mark`) and the Horizon Sea sail of
  light keep their current rendering; the geometry already matches the kit.
