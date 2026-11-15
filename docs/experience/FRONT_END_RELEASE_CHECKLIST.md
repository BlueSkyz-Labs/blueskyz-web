# Front-end release checklist (WCR-FEC)

Condensed and mapped from the Front-End Checklist by David Dias (MIT, https://github.com/thedaviddias/Front-End-Checklist, revision pinned in sgps-core `standards/experience/WEB_CRAFT_SOURCE_REGISTRY.json`). Each row names the gate that proves it; a row without that gate's evidence on the exact candidate is `NOT VERIFIED`.

Candidate commit: `<sha>` · Date (GMT+7): `<yyyy-mm-dd>` · Filled by: `<lane>`

Status values: `PASS / FAIL / NOT VERIFIED / NOT APPLICABLE`.

## Head and meta

| #   | Item                                                                              | Proof                        | Status |
| --- | --------------------------------------------------------------------------------- | ---------------------------- | ------ |
| H1  | `<!doctype html>`, `charset utf-8`, responsive `viewport` (no `user-scalable=no`) | static check or rendered DOM |        |
| H2  | Unique `<title>` and meta description per page, in vi and en                      | build output / SEO check     |        |
| H3  | `lang` set per page; `hreflang` alternates for vi and en; canonical URL           | rendered DOM (GRB)           |        |
| H4  | Favicon set and `theme-color` for light and dark from the brand                   | rendered DOM                 |        |
| H5  | Open Graph and Twitter card with a 1200x630 image from the brand kit              | share preview check          |        |

## HTML and content

| #   | Item                                                                               | Proof                 | Status |
| --- | ---------------------------------------------------------------------------------- | --------------------- | ------ |
| C1  | Semantic landmarks (`header`, `nav`, `main`, `footer`), one `h1`, ordered headings | axe                   |        |
| C2  | No broken links; error page (404) branded and useful                               | link check            |        |
| C3  | Forms: labels, `autocomplete`, input types, `:user-invalid` style errors           | axe + manual keyboard |        |
| C4  | No placeholder, lorem ipsum or invented claims (Product Truth)                     | review                |        |

## Type, CSS and icons

| #   | Item                                                                                                                                                 | Proof                | Status |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- | ------ |
| T1  | House fonts self-hosted (Noto Serif Display 300 display only, Inter, IBM Plex Mono), Vietnamese subset, `font-display: swap`, no remote font request | network log          |        |
| T2  | One icon family (`primary_icon_set` in the adoption record), icon-only controls named                                                                | review + axe         |        |
| T3  | Light, dark and system theme; `prefers-reduced-motion` honoured                                                                                      | rendered check (GRB) |        |
| T4  | Layout holds at every screen class in the project matrix (ASX M1-M11)                                                                                | Playwright / device  |        |

## Images and media

| #   | Item                                                                                                             | Proof      | Status |
| --- | ---------------------------------------------------------------------------------------------------------------- | ---------- | ------ |
| M1  | Modern formats (AVIF/WebP) with explicit width and height; lazy below the fold; LCP image `fetchpriority="high"` | Lighthouse |        |
| M2  | Meaningful `alt`; decorative images empty `alt`                                                                  | axe        |        |

## JavaScript and performance

| #   | Item                                                                                                                           | Proof                         | Status |
| --- | ------------------------------------------------------------------------------------------------------------------------------ | ----------------------------- | ------ |
| P1  | Client JS within the project budget; no unused library where a native feature exists (MWG `legacy-scan` dispositions recorded) | budget gate + adoption record |        |
| P2  | Core Web Vitals within budget: LCP, INP, CLS (CJS)                                                                             | Lighthouse / RUM              |        |
| P3  | No console errors on the main journeys                                                                                         | Playwright                    |        |

## Security and privacy

| #   | Item                                                                         | Proof        | Status |
| --- | ---------------------------------------------------------------------------- | ------------ | ------ |
| S1  | HTTPS only, HSTS, CSP without `unsafe-inline` scripts, `frame-ancestors` set | header check |        |
| S2  | No third-party request without a privacy decision (fonts, icons, analytics)  | network log  |        |
| S3  | No secret or token in the client bundle                                      | secret scan  |        |

## Accessibility

| #   | Item                                                                   | Proof                 | Status |
| --- | ---------------------------------------------------------------------- | --------------------- | ------ |
| A1  | WCAG 2.2 AA: contrast, focus visible, keyboard path, target size 24 px | axe + manual keyboard |        |
| A2  | Screen reader pass on the main journey (one engine at least)           | manual                |        |

## SEO (public pages)

| #   | Item                                                          | Proof        | Status |
| --- | ------------------------------------------------------------- | ------------ | ------ |
| E1  | `robots.txt`, `sitemap.xml`, structured data where it is true | static check |        |

Residual: list every `NOT VERIFIED` row with the reason and the environment that would prove it.
