# BlueSkyz Web — Wave 0 / Wave 1 execution handoff (31 October 2026)

**Status:** OWNER-APPROVED START / EXECUTION IN PROGRESS / CI BLOCKED BY #715 / NOT RELEASE-VERIFIED.  
**Authority:** SGPS FULL, `AGENTS.md`, `docs/current-work.json`, existing decision and evidence records.  
**Repository:** `BlueSkyz-Labs/blueskyz-web` (formerly SGPS-Marketing).  
**Live baseline observed:** `main@21875916e127953e56a80f22f381cd56f051038c`, 2026-10-31 GMT+7. Refresh before touching runtime code or merging.  
**In-flight PR:** [#710](https://github.com/BlueSkyz-Labs/blueskyz-web/pull/710), head `75eea07d0ca815c488e4c23e3c26fe4f22c53bf7`; open, mergeable, Source Assurance [run 41040451996](https://github.com/BlueSkyz-Labs/blueskyz-web/actions/runs/41040451996) passed 10/10 reported jobs on 2026-10-30. **No human visual sign-off was found at this checkpoint.** Automated CI does not establish Human E4, language accuracy, or Cloudflare served SHA.

## Owner decision / execution boundary

Owner approved beginning **Wave 0: current-work first** and **Wave 1: trust / release convergence** on 2026-10-31, based on the preceding GitHub audit. This is approval to document, reconcile, perform non-destructive read-only audits, and prepare source-safe PRs. It is **not** approval to skip existing branch protection, merge #710, modify production configuration, release APKs, start paid traffic, alter payment authority, activate models or tracking tags, or fabricate evidence.

Keep `main` unchanged while work is in Draft PR. Do not introduce another design program overlapping the existing Horizon/Sail, Wave G, SGPS Experience, Journey/Blog, or SEO/Ads plans. Preserve Brand Kit v4, product provenance, Cloudflare deployment ownership, project-specific budgets, and `owner-approved` gates. **All claims are exact-revision bounded.**

## Current truth, not historical assumptions

| Surface                 | 2026-10-31 observed source truth                                       | Boundary                                                                                                                   |
| ----------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Source                  | `main@21875916`; repository ruleset `main-promotion-governance` active | Requires PR, `Quality Gates`, `Browser Assurance`; approving review count configured 0, so independence cannot be inferred |
| In-flight               | #710 open, 3 changed files, 10/10 latest workflow jobs successful      | Human viewport, motion, native-language and no-JS assessment **NOT VERIFIED**                                              |
| Public product registry | Sổ Trọ Preview; Sổ Tâm In development; Vững Tay Lái In development     | No marketing-triggered public sign-in, payment, native store or public APK                                                 |
| Existing editorial      | Five bilingual EN/VI Journal posts on source `main`                    | No mass-generated publishing and no claim inflation                                                                        |
| Analytics               | Cloudflare Web Analytics; client taxonomy emits DOM-only custom events | Do not silently enable new network telemetry, user identifiers, paid pixels or attribution                                 |
| External verification   | #566, #523, #522 remain open                                           | Cloudflare served version, owner DNS/Search Console and M365 mailbox/operational evidence are not source-derived PASS      |
| Inherited backlog       | #451, #290, #638 open                                                  | Reuse their existing owners/plans; signed APK landing waits for product-side artifact                                      |

The 2026-10-27 `docs/current-work.json` note “No PR is open” is **historically dated** and is superseded by this 2026-10-31 live checkpoint. Never rewrite past evidence into a false current state.

## W0.0 — newly discovered P1 security/CI gate (must be resolved before any merge)

On 2026-10-31 the first source-only Draft PR [#714](https://github.com/BlueSkyz-Labs/blueskyz-web/pull/714) ran [Source Assurance 41151416904](https://github.com/BlueSkyz-Labs/blueskyz-web/actions/runs/41151416904) and **FAILED** in `pnpm audit --audit-level=moderate`. Reason: `minimatch <11.0.1`, advisory [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249), identified via `eslint` and `@lhci/cli` transitive developer-tool paths. Architecture/type/lint/build/browser jobs were **SKIPPED**; prior #710 green run is now insufficient evidence for future promotion. This is a **source pipeline blocker**, not a verified website vulnerability or production compromise.

**Single-writer remediation:** [#715](https://github.com/BlueSkyz-Labs/blueskyz-web/issues/715), Security/Toolchain agent. Enumerate the `pnpm why minimatch` major-version graph and `optimizationLevel` exposure; prefer compatible upstream upgrades to blanket cross-major override. Any `pnpm-workspace.yaml` / `pnpm-lock.yaml` / tests change may be protected; do not auto-label or merge. Return to #714 only when exact-head audit and full required CI are green. No audit suppression or test skipping.

## Wave 0 — close current work before adding features

### W0.1 — #710 exact-head review and disposition

- **Owner:** PR coding agent for remediations; independent reviewer or Owner for visual/human verification.
- **Read first:** #710 patch + screenshots, `src/components/product/ProductGuide.astro`, `tests/e2e/guide-chapters.spec.ts`, `docs/QA_STRATEGY.md`, Brand Kit v4.
- **Matrix:** EN/VI/zh-Hans/zh-Hant; 320/390/1440px; light/dark; real Chromium/Firefox/WebKit/mobile; keyboard focus, accessible names and current/pressed state; no-JS, 200% zoom, reduced motion, forced colors, long localized strings, snap/carousel active step versus visually centered card, hero/screenshot readability and cross-product truth.
- **Required proof:** exact PR head checks green; independent screenshots and explicit visual pass or defects; localization review status; no skipped/failed test disguised as PASS; no unauthorized Apple content/assets; owner-policy protected path checks.
- **Exit:** `READY_FOR_OWNER_MERGE_REVIEW` only after checklist and evidence; merge remains Owner/governance mediated. Until then `HUMAN_REVIEW_NOT_VERIFIED`.

### W0.2 — live current-work router reconciliation

- **Owner:** orchestration / governance agent.
- Add this active handoff and update the top-level `updatedAt`. Keep historical notes but label outdated “no open PR” explicitly as historical.
- Maintain exactly one `IN_PROGRESS` wave per `tests/architecture/current-work-router.test.mjs`. Do not set `MERGED` until actual merged evidence exists.
- After #710 changes, rebind `main`, PR head, CI results and any required reviews before reporting status.
- **Exit:** current-work JSON parses and native router tests pass at exact candidate head; Draft PR with no hidden runtime change.

### W0.3 — guard against redundant new work

- **Owner:** coordinator.
- Map open issues and existing plans; no duplicate #566/#523/#522/#451/#290/#638, no new parallel SEO or visual baseline registries.
- Keep the current `docs/superpowers/plans/2026-10-24-seo-ads-marketing-readiness.md` and `2026-10-21-next-waves.md` as the active growth/backlog inputs, not a second product roadmap.

## Wave 1 — trust, provider assurance and operational evidence

| ID / existing issue                                                   | Task                                                                                                                                             | Evidence required for closure                                                                                                                                                                     | Owner / stop condition                                                                                                         |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| W1.1 [#566](https://github.com/BlueSkyz-Labs/blueskyz-web/issues/566) | Cloudflare Worker release readback, provider control plane, exact candidate vs served revision, preview isolation, rollback and anonymous routes | Provider deployment ID + deployed Worker version + unambiguous source SHA bind; security headers/CSP, 404, cache and negative preview→production proof, captured at a known time                  | Owner Cloudflare access; **PROVIDER_NOT_VERIFIED** without authenticated readback; no production mutation to manufacture proof |
| W1.2 [#523](https://github.com/BlueSkyz-Labs/blueskyz-web/issues/523) | Independent company verification / SEO ownership                                                                                                 | Search Console Domain verification, submit absolute `https://blueskyzlabs.com/sitemap.xml`, URL Inspection live test, Bing ownership, truthful visible About/Contact/Organization structured data | Owner DNS / GSC / Bing. No legal incorporation/trademark inference; historical site publication is not verification            |
| W1.3 [#522](https://github.com/BlueSkyz-Labs/blueskyz-web/issues/522) | SGPS-DEC-038 email & identity convergence                                                                                                        | M365 redacted tenant proof EI-03/04/11/13/14, role mailbox owners, restricted forwarding, continuity/recovery, independent send–receive–reply round trip                                          | Owner M365; no DNS/MX changes or mailbox secrets; keep `ADOPTION_MAPPED` while blocked                                         |
| W1.4 [#451](https://github.com/BlueSkyz-Labs/blueskyz-web/issues/451) | Experience Performance & Friction acceptance                                                                                                     | Reconcile 2026-10-20 RUM beacon sample with live provider dashboard and tested negative identifier guard; collect actual field CWV over time, not inferred from Lighthouse                        | Existing SGPS gate owners; do not weaken no-new-tracking/privacy model or substitute synthetic field INP                       |
| W1.5 [#290](https://github.com/BlueSkyz-Labs/blueskyz-web/issues/290) | Test Intelligence evidence keeper                                                                                                                | Refresh mapped ledger and source coverage, preserve unique negative tests; canonical SGPS promotion before `ADOPTED`                                                                              | Local test owner; do not install referenced external skill or prune tests without independent proof                            |
| W1.6 [#638](https://github.com/BlueSkyz-Labs/blueskyz-web/issues/638) | Signed APK download landing planning only                                                                                                        | Official HTTPS host, signed manifest, SHA-256/versionCode/signing fingerprint, release/update/revocation proof, Sổ Trọ upstream approval                                                          | **DEPENDENCY_WAIT**; no upload or publication of APK                                                                           |

### W1 special: search and AI crawler source/edge drift

The 2026-10-29 source handoff records Cloudflare-managed `robots.txt` prepending disallow directives for roughly 40 AI crawlers, potentially contradicting Owner's `search=yes / ai-input=yes / ai-train=no` choice. This is historical evidence, **not a fresh served-state attestation**. Obtain a current served `/robots.txt` observation and Cloudflare dashboard configuration readback before declaring a defect or changing settings. Search Console “Couldn't fetch” alone is not a diagnosed sitemap failure; run live URL Inspection and check the exact absolute URL first.

## Dependency DAG, in strict order

`LIVE_MAIN + PR_QUEUE + SGPS_PIN` → `W0.1 PR #710 REVIEW` → `W0.2 ROUTER RECONCILE / SOURCE-ONLY PR` → `W1.1 EXACT PROVIDER READBACK` and `W1.2 GSC/DNS` and `W1.3 M365` (independent Owner workstreams) → `W1.4 RUM / HUMAN E4` → `RELEASE QUALIFICATION`.

W1.5 and W1.6 remain separate bounded dependencies; neither blocks this docs-only planning PR, and neither may certify production release.

## Decision / evidence protocol

- **Source pass:** the exact candidate commit passed required CI. No implication about deployed code.
- **Production verified:** independently bound Cloudflare deployed revision, served content and operational smoke; if any missing, `NOT_VERIFIED`.
- **Human E4:** actual user/Owner evaluation only; no agent-generated synthetic participant or inferred sign-off.
- **Language review:** native zh/zh-Hant and Owner VI cross-check explicitly `NOT_VERIFIED` until evidenced.
- **Product truth:** upstream exact revision or approved record; no artificial release status, screenshots, subscriptions or AI capability.
- **Security:** no source claims of compromise from an assurance gap; no secret exfiltration, deployment mutation or unapproved provider change.
- **Exit gate:** no P0/P1 known regression; source checks green at exact head; every unresolved external item has a named owner, evidence link and `NOT_VERIFIED` boundary.

## Acceptance / audit checklist

- [x] Owner approved the Wave 0 + 1 start on 2026-10-31.
- [x] Read-only rebind of `main` and PR #710 completed.
- [x] Existing open-issue ownership preserved (no duplicate umbrella issue).
- [ ] #710 human visual + native language review complete.
- [ ] #710 merged through normal protected policy (not authorized by this plan).
- [ ] #715 compatible security remediation approved, merged and audited; PR #714 CI was FAILED and remains non-PASS.
- [ ] Local source-only current-work PR all required CI green.
- [ ] #566 exact deployed Worker/source linkage.
- [ ] #523 Search Console/Bing and external verification closed with Owner proof.
- [ ] #522 M365 identity and delivery evidence closed with Owner proof.
- [ ] #451 provider/field performance and privacy proof complete.
- [ ] Release qualification evidence and Owner acceptance recorded.

## Next agent handoff

1. Resolve/check #715 P1 dependency audit blocker through protected security review; no other PR may claim CI PASS from skipped jobs. Then fetch `main`, #710 and latest runs again; do not infer an open PR state from this snapshot.
2. Finish W0.1 review, file precise actionable defects on #710 if found, or explicitly leave Human E4 pending.
3. Reconcile this doc and `docs/current-work.json` through exact-head CI on the current Draft PR; do not merge.
4. Run parallel **read-only** W1 evidence collection where provider access is available; report blockers honestly to Owner.
5. Start Wave 2 customer-centric enhancements only after these gates are reconciled; no WebGL/3D or new runtime by default.

## Execution addendum — source readbacks on 2026-10-31

- **P1 #715:** protected Draft [#716](https://github.com/BlueSkyz-Labs/blueskyz-web/pull/716) carries a controlled `minimatch@11.0.1` cross-major compatibility candidate, frozen graph and regression test. [CI run 41153013212](https://github.com/BlueSkyz-Labs/blueskyz-web/actions/runs/41153013212) stopped at the **Owner-approved protected-path policy**; dependency audit, ESLint, legacy glob compatibility and browsers were **SKIPPED / NOT VERIFIED**. The agent did not self-label, merge or deploy; approval and independent actual CI remain mandatory. No exemption/audit bypass was introduced.
- **Product Truth:** new read-only [cross-repo delta evidence](../../evidence/2026-10-31-product-truth-cross-repo-delta.md) compares current product upstream heads to Marketing source pins. Sổ Trọ's authoritative `docs/product/public-profile.json` has the **same blob SHA** as the vendored Marketing snapshot; 444 upstream commits do not by themselves justify re-vendoring or a new product claim. Sổ Tâm / Vững Tay Lái have 770 / 234 intervening commits; runtime/promotability remains unverified and marketing stays source-pinned.
- **External edge:** current HTTP `robots.txt`, sitemap, and rendered product URLs could not be independently fetched from the available web access; no current Cloudflare production PASS or new edge defect is asserted. Owner Cloudflare / Search Console readback remains a separate external gate.
