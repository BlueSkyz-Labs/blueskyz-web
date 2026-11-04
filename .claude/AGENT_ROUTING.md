# Agent model routing (cost-aware)

The orchestrator (the main session) plans, decides and edits Vietnamese. It delegates work by kind:

| Agent         | Model          | Use for                                                                     | Never for                        |
| ------------- | -------------- | --------------------------------------------------------------------------- | -------------------------------- |
| `scout`       | Haiku (latest) | grep, file location, CI log triage, status checks, summaries                | edits                            |
| `mechanic`    | Haiku (latest) | verbatim copy-deck rows, listed renames, listed test pins, listed deletions | design, new logic, VI/zh wording |
| `implementer` | Sonnet         | one v8 wave: components, CSS, behaviour, tests and a PR                     | review of its own PR             |
| `reviewer`    | Opus           | W11 verification, VI review, truth/security review, red team                | implementation                   |

## Worker lane: OpenCode Go and the free pool (Owner 2026-11-05)

Same mechanism as Sổ Trọ. Grunt work goes to the cheap lane before any
Claude agent: drafts of code, tests, refactors, data transforms and technical
docs that a gate can check (complexity up to 3 of 5).

1. `node scripts/opencode-free-worker.mjs --fallback-go` for one task: the
   free pool first, then DeepSeek Flash on OpenCode Go.
2. `node scripts/opencode-fanout.mjs --split --fallback-go` for a task with
   independent parts: DeepSeek Flash splits it, up to 5 subtasks run in
   parallel on the free pool.
3. Only if the worker exits non-zero (no quota, network blocked, refused),
   use `mechanic` or `implementer` and say why in the PR or checkpoint.

The lead reads every worker diff and runs the gates; the worker never
certifies itself. Never send secrets, visitor data, public copy, product
claims, design decisions or security/release verdicts. Setup, limits and
evidence: `docs/runbooks/opencode-go-worker.md`.

## Token rules

1. **Mandatory first read:** active plan `docs/superpowers/plans/2026-10-02-v9-completion-golive.md` §8 (agent execution contract) and your §9 task card. Then read only the files your card names. v8 plan §5 still supplies ports, the glossary (§5.3) and PR conventions. Do not read the whole plan or the deck.
2. Use `file:line` references instead of pasting code. Quote at most 5 lines.
3. Delegate lookups to `scout` instead of reading many files in an expensive context.
4. Run independent tool calls in parallel. Never re-read a file you just edited.
5. Keep reports short: Haiku agents ≤ 10–15 lines, the implementer ≤ 12 lines.
6. Escalate instead of guessing: Haiku agents stop on any ambiguity and hand it back.
7. Independence: the agent that implements a change never verifies it (plan W11, AGENTS rule 29).

## Prompt routing (SGPS vNext, `SGPS-DEC-2026-036`)

The Owner activated the SGPS vNext prompts for orchestration on 2026-10-04.

**Exact reference:** sgps-core `main@e90a998` (PR #278 merged). This routing becomes `ADOPTED` once this file is merged on `main`. The project's SGPS release pin is unchanged (overlay only, AGENTS rule 52).

Each agent loads only what the router returns for its own lane. Never paste a prompt into always-on context.

**Routing command.** The orchestrator runs the router once per phase change and again before review or merge. It runs from a trusted sgps-core checkout at the reference above, never from the PR checkout:

```bash
git diff --name-only origin/main...HEAD | python <sgps-core>/tools/sgps_prompt_route_vnext.py route --phase <PHASE> --changed-files -
```

**What each agent loads:**

| Agent                       | Phase                 | Loads                                                                                          |
| --------------------------- | --------------------- | ---------------------------------------------------------------------------------------------- |
| orchestrator (main session) | every phase           | Kernel K0–K10, then Master in the phase mode. Decides the phase and surfaces                   |
| `implementer`               | `EXECUTE`             | Kernel, then the specialists routed for its card's changed files (website: usually Experience) |
| `reviewer`                  | `REVIEW` or `RELEASE` | Kernel, then the routed specialists, run independently. maker != judge (rule 7)                |
| `scout`, `mechanic`         | none                  | No prompt. They still obey K0: report live state, never claim it from memory                   |

**Usual routes for this repo.** The router's default path rules cover this repo, so no local override is needed:

| Change                                                       | Routed specialist                                   |
| ------------------------------------------------------------ | --------------------------------------------------- |
| `*.astro`, `*.css`, `components/`, `pages/`, `i18n/`, tokens | Experience                                          |
| `package.json`, `pnpm-lock.yaml`                             | Security                                            |
| `wrangler*`                                                  | Release                                             |
| Go-live (`RELEASE`)                                          | Security + Release mandatory, Experience by surface |

**Owner reports** are in Vietnamese and end with the kernel K10 continuation answer: "CÒN LÀM TIẾP ĐƯỢC KHÔNG?".
