# DESIGN.md: locked design system (BlueSkyz Labs website)

Design agents (Hallmark and others) treat this file as the locked system: it overrides their own themes, catalogues and defaults. This is a house surface: Hallmark runs in audit mode only here.

## Source of truth

- Brand Kit v5 masters: `brand/blueskyz-brand-kit-v5/` (logo, colour tokens, type with OFL texts, web icons).
- The site's component system and tokens: `src/styles/` (`global.css`, `display-type.css`, `c4-quiet-authority.css`) and `src/components/`.
- Icons: the house registry `src/lib/icon-registry.ts` (stroke 1.5, round caps and joins, `currentColor`); WCR 1.0 `primary_icon_set: own`.
- Copy: `docs/editorial/PUBLIC_CONTENT_STANDARD.md` and `JOURNAL_PRESS_STANDARD.md`.

## Type (mandatory, house)

- Display titles only: Noto Serif Display 300, upright and italic; italic is the only emphasis.
- Interface and body: Inter. Figures: IBM Plex Mono 400.
- Self-hosted with the Vietnamese subset; no runtime font CDN.

## Not allowed

- Third-party themes, template layouts or stock photographs in place of product screens.
- Generated imagery without the Owner's approval.
- Invented facts, numbers, testimonials or quotes on any page.
- Motion that ignores `prefers-reduced-motion`.
