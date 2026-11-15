# Web Craft References adoption record (WCR 1.0) — BlueSkyz Labs website

Standard: sgps-core `standards/experience/WEB_CRAFT_REFERENCES_STANDARD.md`, pins in `WEB_CRAFT_SOURCE_REGISTRY.json` (sgps-core #433).
Brand wins on any conflict: Brand Kit v5 (house type, house colour, sail), the C2 to C4 experience contracts and `docs/editorial/PUBLIC_CONTENT_STANDARD.md` stay authoritative.

| Field                   | Value                                    |
| ----------------------- | ---------------------------------------- |
| Project commit read     | `b823c5184532`                           |
| sgps-core revision read | `e3af026c1142`                           |
| Date (GMT+7)            | 2026-11-15                               |
| Surfaces in scope       | public web (Astro 7 static, Tailwind v4) |

## 1. Decisions

| Reference                         | Decision                      | Pin read                    | Reason                                                                                                                                                                                                                                                                                            |
| --------------------------------- | ----------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Modern Web Guidance (agents)      | ADOPT                         | `modern-web-guidance@1.0.0` | Agents query `search`/`retrieve` before building a UI pattern. Not added to `package.json`, CI or the build. `built-in-ai` guides excluded (the Concierge stays separately gated).                                                                                                                |
| Icons: `primary_icon_set` = `own` | KEEP_OWN                      | n/a                         | House registry `src/lib/icon-registry.ts` + `BlueSkyzIcon.astro` (7 allowlisted icons, 24 px grid, stroke 1.5, round caps, unknown names fail the build). A new icon may start from a Lucide shape (ISC), redrawn to `ICON_GRAMMAR`, source noted beside the entry. No icon package, font or CDN. |
| Apple HIG                         | PARTIAL                       | guidance                    | Read for iOS Safari behaviour (safe areas, 44 pt targets); no Apple asset.                                                                                                                                                                                                                        |
| Google Style Guides               | ADOPT (tie-breaker)           | `a9c5f82b1981`              | See §2. No mass reformat.                                                                                                                                                                                                                                                                         |
| Front-End Checklist (release)     | ADOPT (mandatory, public web) | `e8d14d049010`              | `docs/experience/FRONT_END_RELEASE_CHECKLIST.md` on each release candidate; rows map to the existing source-assurance ladder (axe, Lighthouse, link check, client budget, headers).                                                                                                               |
| daisyUI                           | KEEP_OWN                      | n/a                         | Tailwind is used, but the site has its own C2 to C4 component system and design tokens (WCR §5: brand wins).                                                                                                                                                                                      |

## 2. Code style map

| Language in repo                            | Formatter / linter (wins)                                                    | Guide for what tools leave open |
| ------------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------- |
| TypeScript, Astro                           | Prettier (`.prettierrc.json`) + ESLint (`eslint.config.mjs`) + `astro check` | Google TypeScript Style Guide   |
| JavaScript (`public/*.js`, `scripts/*.mjs`) | Prettier + ESLint                                                            | Google JavaScript Style Guide   |
| HTML and CSS                                | Prettier, Tailwind v4, house tokens                                          | Google HTML/CSS Style Guide     |
| Markdown (docs, journal)                    | Prettier; editorial standards win                                            | Google Markdown Style Guide     |

## 3. Modern Web Guidance legacy-scan

Command: `npx -y modern-web-guidance@1.0.0 legacy-scan .` on commit `b823c5184532`. Result: **5 findings from 3 guides** (of 33 scanned; docs and tests skipped).

| Guide id                             | File:line                              | Disposition                                                                                                                                                                                                                                                                                    |
| ------------------------------------ | -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dialog`                             | `src/scripts/capture-viewer.ts:62`     | KEEP: delegated click on the gallery root that opens the viewer, not a backdrop dismiss (false positive).                                                                                                                                                                                      |
| `dialog`                             | `src/scripts/capture-viewer.ts:85`     | DEFERRED: backdrop dismiss could become `<dialog closedby="any">`, but `closedby` is not in every engine of the browser matrix (WebKit); the listener is the fallback. Revisit when `closedby` is Baseline, with the listener kept behind a `"closedBy" in HTMLDialogElement.prototype` guard. |
| `dialog`                             | `src/scripts/command-navigator.ts:232` | DEFERRED: same reason as above.                                                                                                                                                                                                                                                                |
| `declarative-dialog-popover-control` | `src/scripts/capture-viewer.ts:83`     | KEEP: the close button is created in script with the dialog; a `commandfor`/`command="close"` attribute would also need WebKit support (Invoker Commands) and the e2e focus tests.                                                                                                             |
| `dark-mode-toggle`                   | `public/theme-init.js:5`               | KEEP: the saved theme sets `data-theme` before first paint and `src/styles/global.css` pairs it with `color-scheme: light/dark`, so native controls already follow; a `<meta name="color-scheme">` update adds nothing visible.                                                                |

## 4. NOT VERIFIED

- legacy-scan covers about 20% of the guides; the rest are used per task through `search`.
- The front-end release checklist has not yet been filled for a release candidate; the first fill belongs to the next release train.
