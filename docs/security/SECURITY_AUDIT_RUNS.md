# Security audit runs (ASK-SEC): blueskyz-web

Full source audits with the pinned Cloudflare security-audit skill (sgps-core `skills/security-audit-run/SKILL.md`), triaged under GSRS. One row per run.

| Date (GMT+7) | Commit  | Scope                                                                                                                                                                                                   | Agents (model)                         | Confirmed | Needs validation | Rejected | Fix PRs | Run by                            |
| ------------ | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- | --------- | ---------------- | -------- | ------- | --------------------------------- |
| 2026-11-15   | b823c51 | source-only; headers/CSP/redirects (`public/_headers`, `wrangler.toml`, layouts), client scripts, public derived views, `.github/workflows/quality-gates.yml`, deploy/smoke scripts, model lane workers | 2 hunters (Sonnet) + lead verification | 0         | 1 (fixed)        | 1 note   | #734    | agent, thread "Agent skill packs" |

## Run 1 (2026-11-15)

- Headers: strict CSP (`script-src 'self'`, Trusted Types, `frame-ancestors 'none'`), HSTS, nosniff, COOP/CORP; `workers_dev` and preview URLs off; redirects exact and same-origin. No DOM sink takes URL or content state; JSON-LD is escaped. Public manifests list only published products.
- CI: `pull_request` only, `contents: read`, SHA-pinned actions, no secrets, the merge policy runs from the base commit, event values reach shell only through `env:`.
- **Fixed (needs validation on a real CLI):** `scripts/opencode-free-worker.mjs` gave the opencode CLI child the whole environment and denied only edit, bash and webfetch, so injected prompt text could make a free third-party model read local files or the environment and send them to its provider. The child now gets only PATH-class variables plus its one key variable, and every tool is denied (`tests/architecture/opencode-worker-lane.test.mjs`, RED then GREEN).
- Rejected note: the CSP source `https://static.cloudflareinsights.com/beacon.min.js/` is correct as a path prefix (the beacon URL is `beacon.min.js/v<hash>`).
- Hardening for later: `CLAUDE_API_KEY_VAR` accepts any env name; `lane-dispatch.mjs` and `opencode-fanout.mjs` pass the full env to lanes; `PROTECTED_PATHS` does not list `astro.config.mjs` or `tools/`; `style-src 'unsafe-inline'`.
- Not fully read: seven client scripts were grepped for sinks only (command-navigator, intent-lens, fidelity-engine, mobile-menu, analytics-bridge, horizon-sea, dossier-composer).
