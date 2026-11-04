# Agent guide — BlueSkyz Labs Web (blueskyz-web)

> **2026-10-21 OPERATING RULES (durable):** Read `.claude/OPERATING_RULES.md` every session: Owner comms in Vietnamese with GMT+7 12h times, flow/merge discipline, local hygiene, harness/multi-agent lanes, FinOps and the weekly learning loop.

> **2026-11-05 OPENCODE GO WORKER LANE:** Grunt engineering drafts go to `node scripts/opencode-free-worker.mjs --fallback-go` (free pool, then DeepSeek Flash on OpenCode Go; reuses `blackangelz/blueskyz-studio` `go_first.py`) before any Claude agent, per `.claude/AGENT_ROUTING.md`. The lead reviews and runs gates. Never send secrets, visitor data, public copy, claims or security/release verdicts. Runbook: `docs/runbooks/opencode-go-worker.md`.

> **2026-10-18 APP DOWNLOAD & STORE CLAIMS:** Before adding a signed-APK landing, app store badges, seller information or localized marketplace claims, read `docs/sgps/2026-10-18-mobile-store-distribution-owner-adoption.md`. This site is not payment/signer/Store authority; require exact approved Product release, signing identity, checksum, verified endpoint and publication gate first.

> **2026-10-09 PORTFOLIO OWNER WORK WAVE — AI Factory + Experience:** Before dev/UX/PR promotion read `docs/sgps/2026-10-09-AI_FACTORY_EXPERIENCE_ADOPTION.md` after refreshing live truth. Continue safe approved work autonomously; require independent exact-head, real rendered UX proof and keep existing project Owner/brand/security/instruction protections. The SGPS Core #293 candidate does NOT change pins or grant merge/release authority. Do not self-apply `owner-approved`.

Trusted current source of truth only:

- **Experience contract:** `docs/superpowers/specs/2026-09-03-blueskyz-web-v1-c1-1-design.md` — substantive design remains authoritative; its pre-implementation status text is historical.
- **C2 experience foundation:** `docs/superpowers/specs/2026-09-13-c2-cinematic-product-house-design.md` plus `docs/superpowers/plans/2026-09-13-c2-cinematic-product-house-implementation.md`. C2 P0–P6 source changes are merged. Five product profiles are source-listed; source merge/brand imagery does not establish deployed exact-head anonymous access or verify every capability. Keep #291 Product Truth remediation and independent runtime evidence open.
- **Approved C3 successor design:** `docs/superpowers/specs/2026-09-13-c3-living-verifiable-product-experience-design.md` — extends C2 after dependency readiness is proven.
- **Active C3 execution router:** `docs/superpowers/plans/2026-09-13-c3-living-verifiable-product-experience-master.md` — routes C3 into independent child plans; never execute C3 as one mega-PR.
- **Active residual / owner-gated work:** `docs/current-work.json` — canonical current-work router, including product screenshot/owner facts, Human E4, RUM privacy decision, C3 Concierge provider/privacy gate and Spatial/WebGL GO gate.
- **Approved SGPS Premium Experience & Design Excellence v2.0 design spec:** `docs/superpowers/specs/2026-09-27-sgps-premium-experience-excellence-v2-design.md` — authoritative v2.0 experience specification adopting SGPS FULL.
- **Active SGPS v2.0 master plan:** `docs/superpowers/plans/2026-09-27-sgps-premium-experience-excellence-v2.md` — master execution plan routing into independent phases.
- **Approved Brand Kit v4 Standardization design spec:** `docs/superpowers/specs/2026-09-27-brand-kit-v4-standardization-design.md` — authoritative Brand Kit v4 aesthetic standardization specification.
- **Active Experience & Design Convergence v5 plan (Owner-approved 2026-09-27):** `docs/superpowers/plans/2026-09-27-experience-design-convergence-v5.md` — reconciles the v2.0 and Brand Kit v4 plans with Council #293; where they conflict, its adjudication table governs. Marketing is not a payment authority (Owner D-0).
- **Active Brand Kit v4 Standardization master plan:** `docs/superpowers/plans/2026-09-27-brand-kit-v4-standardization.md` — master execution plan for Brand Kit v4 aesthetic standardization and Living Maison.
- **C3 / SGPS delta reconciliation:** `docs/evidence/2026-09-16-c3-sgps-delta-reconciliation.md` — records the live post-C2 baseline and explicit applicability of current SGPS source overlays without silently repinning the project.
- **Historical implementation plan:** `docs/superpowers/plans/2026-09-04-blueskyz-web-v1-c1-1-implementation.md`.
- **Framework decision:** `docs/decisions/0004-web-framework-selection.md` (`ASTRO_7`).
- **Source assurance decision:** `docs/decisions/0005-dual-control-source-assurance.md`; historical pre-ruleset wording is superseded by provider read-back.
- **Canonical domain decision:** `docs/decisions/0006-domain-migration-and-product-subdomains.md`.
- **Architecture decision:** `docs/decisions/0007-sgps-architecture-canonical-model.md`.
- **Canonical architecture model:** `architecture/sgps-model.json`.
- **Derived architecture views:** `architecture/derived-views.json` — `VIEW_IS_DERIVED_NOT_ARCHITECTURE_TRUTH`.
- **Decisions index:** `docs/decisions/README.md`.

Before any material work, refresh live `main`, open PRs/issues, `docs/current-work.json`, provider/ruleset state, and any newer ADR/spec/plan/SGPS truth. A SHA recorded in a plan is a handoff baseline, never permission to ignore newer repository truth.

## C2 foundation doctrine

- **Static-first. Product-led. Cinematic at the moments that matter. Evidence-rich underneath.**
- Product truth remains a prerequisite for product spectacle. If a real screenshot/product fact is absent, record the blocker; never fabricate it.
- C2 changed public composition and disclosure depth, not the authority of SGPS truth/security/provenance systems.
- `ExperienceSpine`, `IntentLens`, and `Atlas` are not required prominent homepage surfaces under C2; do not delete their capabilities merely because the homepage no longer leads with them.
- Cinematic code may consume product/claim truth but may never become a second registry or invent stronger assurance semantics.
- Static/no-JS and reduced-motion states must independently meet the content/action contract.

## C3 successor doctrine

- **Living product. Verifiable intelligence. Adaptive premium experience.**
- C3 extends C2; do not replace canonical truth, source assurance, architecture or accessibility controls.
- C3 is decomposed into independent plans: Experience Craft, Trust Continuum, Living Product, Adaptive Experience, Verifiable Concierge, Living Release Publication, and optional Spatial Halo.
- **C3-A Experience Craft Foundation is the default first runtime wave** after post-C2 readiness is proven.
- Presentation may reorder, reveal, animate, compare or summarize canonical truth; it may never create product/claim/evidence/release truth.
- Visitor intent, reading mode and fidelity are presentation state only and must not mutate lifecycle, claim, evidence or assurance state.
- The Verifiable Concierge is a separately gated application subsystem. No remote AI/model implementation before a dedicated architecture/privacy/security decision and owner approval of provider/runtime/logging/abuse/cost boundaries.
- Spatial/WebGL is an optional hypothesis-driven halo experiment. Native HTML/CSS/SVG comes first; NO-GO is a valid successful outcome.
- Agent-readable public manifests are derived views only and must not leak unpublished products, private evidence, internal paths, secrets or unsupported assurance claims.

## SGPS FULL applicability discipline

- Published SGPS release truth and current source-overlay truth are distinct. Do not silently repin the project to moving `sgps-core/main`.
- Discover current SGPS decisions, classify applicability locally, and record explicit deltas before material waves.
- Current post-C2 reconciliation is recorded in `docs/evidence/2026-09-16-c3-sgps-delta-reconciliation.md`.
- Experience 1.4 / public-truth doctrine is applicable to this public brand surface and must remain preserved by C3.
- Architecture authority/customer-platform doctrine becomes materially applicable if C3 introduces remote AI/customer-platform authority boundaries; it does not authorize those systems by itself.
- RCR is used as the material-risk/control/recovery lens for agentic production work; high-risk C3-E/C3-G decisions require their own scoped treatment/evidence.
- Decision Architecture remains a candidate source overlay and is not globally mandatory for this repository absent an explicit later adoption/promotion decision.

## Hard rules

- Do **not** invent corporate emails, legal prose, product claims, screenshots, photography, owner/product facts, user-research participants, quotes, completion rates or acceptance outcomes.
- Prefer the smallest **sufficient** root-cause change over symptom patches.
- Public content (Owner, 2026-10-25, MANDATORY): every article and customer-facing sentence meets `docs/editorial/PUBLIC_CONTENT_STANDARD.md` (reader first, plain natural VI/EN, truthful claims with no self-praise or unsupported superlatives, VI = EN, search/share hygiene, WCAG 2.2 AA) and `docs/editorial/JOURNAL_PRESS_STANDARD.md`; copy is independently reviewed and polished before publication and re-read on the live site after it.
- Customer-centric decisions (`SGPS-DEC-2026-041`, LOCK): judge the whole customer journey first (CC-1), state any customer degradation explicitly (CC-2), never rank it above security, money safety, privacy or legal constraints (CC-3), and bring customer-vs-cost/speed/prior-choice conflicts to the Owner instead of resolving them silently (CC-5).
- Never weaken tests, lint, truth gates, dependency audit, security controls, source assurance, provider governance or accessibility/performance budgets to go green.
- Canonical organizational origin is `https://blueskyzlabs.com` per ADR 0006. `tonydemo.com` is retired/transition history and must not pass the production public-truth gate.
- Empty public registry + empty email → Act soft-land via `src/lib/act.ts` (About / Security), not a Contact dead-end.
- Normal changes use **branch → PR → exact-head Source Assurance → merge**. Direct-to-`main` is not a fallback.
- Active ruleset `main-promotion-governance` (`22500299`) protects `main`: PR required, strict `Quality Gates` + `Browser Assurance`, conversation resolution, non-fast-forward/deletion blocking, no bypass actors.
- Auto-merge is allowed. A PR that changes a path listed in `scripts/check-merge-policy.mjs` (`PROTECTED_PATHS`: CI, hooks, scripts, brand kit, ADRs, agent/security policy, deploy and gate configs; plus `package.json` changes to scripts/engines/overrides, new dependencies or major bumps. Lockfile-only and patch/minor bumps flow automatically) fails `Quality Gates` until the Owner adds the `owner-approved` label. Agents never add, remove or ask to bypass that label, and never enable auto-merge on such a PR.
- Green evidence belongs only to the exact tested SHA. UNKNOWN / skipped / stale checks are not PASS.
- GitHub Actions is **source assurance only**: read-only token, no persisted checkout credentials, no Cloudflare secrets, no deployment commands.
- Cloudflare Workers Builds remains preview/production build and deployment authority.
- SGPS architecture truth lives in `architecture/sgps-model.json`; diagrams/views are derived. Provider/runtime evidence outranks stale authored topology and must trigger reconciliation.
- Automated/browser E4 evidence does **not** substitute for real-user customer-task and brand-interpretation evidence required by the experience contract; agent walkthroughs and LLM simulations are preflight only.

## Source gates

Canonical source-assurance path:

`frozen install → dependency audit → architecture contracts → typecheck → lint → format → build → client budget → static links → cross-browser/axe → Lighthouse`

Architecture-affecting changes must regenerate/check derived views with `pnpm architecture:views:check`. GitHub Source Assurance repeats deterministic source gates and runs the repository E4 Playwright/axe matrix across Chromium, Firefox, WebKit/Safari-class and mobile Chromium, followed by Lighthouse evidence for PR/main candidates. See `README.md` and `docs/QA_STRATEGY.md` for full commands and promotion flow.

## LONG-RUNNING — LUẬT TOÀN HERMES (Owner chốt 2026-09-19, BẮT BUỘC mọi dự án/mọi agent)

Còn wave/plan/task ACTIONABLE → chạy end-to-end, KHÔNG dừng hỏi/báo cáo; hết wave tự mở wave mới, tự merge an toàn (branch→PR→exact-head gate→merge). Chỉ dừng khi EXTERNAL/MANUAL/BLOCKED-SAFETY hoặc Owner lệnh dừng. Precedence: Safety/Policy/Provider > Mandatory SGPS > Product Truth > ADR/Spec mới > active Plan > repo contracts > impl > conventions. SGPS = discover-everything / ACTIVATE-applicable, exact-identity.
