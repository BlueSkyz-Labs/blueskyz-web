# Agent skill packs adoption (ASK 1.0, Golden Path GP-35)

Standard: sgps-core `standards/portfolio/AGENT_SKILL_PACKS_STANDARD.md` (registry `ASK-1`, sgps-core #436, `6cd53ed`). Brand Kit v5, Product Truth and `docs/editorial/PUBLIC_CONTENT_STANDARD.md` win on any conflict.

- **Project commit this record describes:** `b823c51` (main when written, 15 Nov 2026 GMT+7)
- **Installer:** run from sgps-core: `node <sgps-core>/templates/project/scripts/sgps-skill-packs.mjs install all` then `check`. Not copied into this repository: `scripts/` is an Owner-label path here and the packs install at session level, outside the repository. Verified in the authoring session: 42 pinned skills, `check` 0 problems.

| Pack                       | Pin                | Disposition here  | Notes                                                                                                                 |
| -------------------------- | ------------------ | ----------------- | --------------------------------------------------------------------------------------------------------------------- |
| humanizer (copy polish)    | v4.0.0 `b48c832`   | ADOPT             | every public sentence, vi and en, before and after publication; runs with the editorial standard, never instead of it |
| marketingskills (SGPS:GTM) | v2.14.12 `1f83744` | ADAPT             | SEO, AI search, schema, site architecture, launch, content; context `docs/gtm/PRODUCT_MARKETING.md`                   |
| astryx (design system)     | v0.7.14 `c6ca304`  | REFERENCE         | the site keeps its own Astro C2 to C4 component system and tokens; no dependency                                      |
| hallmark (craft audit)     | 2.0.0 `04977e1`    | ADAPT, audit only | brand lock `DESIGN.md` present; build and redesign modes not used on this house surface                               |
| security-audit             | `c1c8a8c`          | ADOPT             | first full run is queued; its run log goes in `docs/security/` (Owner-label path) when it runs                        |

## Copy polish log

| Surface                                | Language | Date (GMT+7) | Commit                                                           | Facts unchanged checked | Independent read |
| -------------------------------------- | -------- | ------------ | ---------------------------------------------------------------- | ----------------------- | ---------------- |
| Home, products, contact, support lines | vi, en   | 2026-11-15   | `b823c51` (#731, before this standard; recorded as the baseline) | yes, in #731            | #731 review      |

## NOT VERIFIED

- No Hallmark `sloplint` run recorded yet on the rendered site.
- No security-audit run on this repository yet.
