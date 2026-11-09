# Product Truth cross-repository delta — 2026-10-31

**Scope:** read-only product-source provenance check for Web Wave 0/1; source audit only.  
**Web baseline:** `BlueSkyz-Labs/blueskyz-web@21875916e127953e56a80f22f381cd56f051038c`.  
**Evidence class:** GITHUB_REPOSITORY_READBACK. **Not** deployed product readiness, paid go-live, authentication cutover or Human E4 evidence.

## Current source and upstream default heads

| Public marketing profile | Web sourceRevision                         | Upstream `main` on 2026-10-31              | Commits ahead of pin | Claim status / decision                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ------------------------ | ------------------------------------------ | ------------------------------------------ | -------------------: | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sổ Trọ                   | `e6fc6c5573e202dea084eba778ed01cd826d2c3e` | `339aa5a768bbf1453824d2ed71167c59d4421a67` |                  444 | **Canonical snapshot still byte-identical**: `BlueSkyz-Labs/Sotro/docs/product/public-profile.json` and `src/data/upstream/sotro.public-profile.json` have the same Git blob SHA `125d7a22127c69c92edca0b231ee167a379387a7` at readback. The unchanged public-profile source does not need to be re-vendored solely because main advanced. Marketing claims remain pinned and Preview.                                                                                       |
| Sổ Tâm                   | `ffb771b5f47886b581df0c1409c7f1b5ea758724` | `734c63c99f0f916222d093de695d4196ec5ad4ea` |                  770 | The marketing profile is In development; `docs/product/public-profile.json` was not found at latest upstream main. Latest upstream governance discusses Better Auth, but some records explicitly say it is **not yet a runtime adoption**. Marketing contains a historical Logto sign-in URL that is not offered as a public CTA. Require upstream exact-authority readback before changing the link, platform or accessibility promise; never infer cutover from ADR alone. |
| Vững Tay Lái             | `69e43e0d0339a8b741f8eb21b82c92a2a6ed2c32` | `77d4d1efd04a3deaf71b55676ef139bf8eb73b21` |                  234 | The public listing remains In development, class-B-focused. The latest upstream source is far newer, but there is no verified assertion that individual published claims are false. No public native/store/login/AI capability promotion until a source-qualified and Owner-approved profile update.                                                                                                                                                                         |

**Method:** GitHub `main` branch readback + Compare API from each listed `sourceRevision` to the latest default head. Compare reports `ahead` with `behind=0` for all three; this does not assess every semantic claim. The Compare API truncates file details after 300 files, so the `files` array is not a complete feature inventory. Sổ Trọ profile content equivalence was determined from the identical upstream and vendored Git blob SHA, not from matching a partial textual sample.

## Canonical truth constraints

1. **Source pin ≠ latest HEAD.** An unchanged canonical public profile can remain valid at an older immutable pin. Keep the existing source qualification and pinned provenance; do not auto-update `sourceRevision` or claim product freshness merely because main advanced.
2. **Marketing ≠ payment authority.** Current Sổ Trọ web profile stays `beta/preview`; no price, uncapped signup or paid go-live claim. Product-side source contains independent bounded production/canary facts, and only that owner can authorize public promotion.
3. **Sổ Tâm auth migration ≠ active production auth.** Better Auth architecture/desk qualification is not evidence of a deployed migration; the historical sign-in URL is not currently presented as a public CTA. Reconcile through the product's actual merged auth/route/provider evidence before publishing an access destination.
4. **Vững Tay Lái in-development stays in-development.** Public site may describe source-proven educational goals without implying a fully launched app, mobile store presence, remote AI runtime or sign-up.
5. **Do not infer source truth from build or production.** All external provider, app runtime, user-task, native-language and conversion gates stay independent.

## Review work queue — existing lane, not a new program

- **PT-1 (P1):** Define an incrementally maintainable, repo-owned `public-profile` adapter for Sổ Tâm and Vững Tay Lái if their upstream teams approve; avoid inventing duplicate registries. If no canonical profile exists, keep Marketing source pin with exact evidence rather than synthesizing unapproved claims.
- **PT-2 (P1):** On a real upstream public-profile change, compare the actual field-level diff and revised authority, then update Marketing YAML, source qualification and snapshots in one controlled PR, preserving negative tests.
- **PT-3 (P1):** Reconcile Sổ Tâm's historical `appAccess.signInUrl` against independently verified **current** auth runtime before ever rendering a login CTA; no migration action here.
- **PT-4 (P2):** Re-check proof screenshots/identity taglines across Product Guide #710 and existing showcases for real product meaning, synthetic-data disclosure and development-state labels; no claim inflation.
- **PT-5 (Owner/provider):** Cloudflare served revision, real signup status, payment canary, legal statements and native store artifacts stay `NOT_VERIFIED` until their authorized upstream owners publish evidence.

## Security/CI coupling

Draft security candidate [#716](https://github.com/BlueSkyz-Labs/blueskyz-web/pull/716) remains blocked at protected-path Owner approval pending exact-head test execution. Draft Wave 0/1 tracking PR [#714](https://github.com/BlueSkyz-Labs/blueskyz-web/pull/714) remains docs-only and is not production readiness. No automatic feature, deploy or payment changes result from this provenance readback.
