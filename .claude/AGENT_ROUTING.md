# Agent model routing (cost-aware)

The orchestrator (the main session) plans, decides and edits Vietnamese. It delegates work by kind:

| Agent         | Model          | Use for                                                                     | Never for                        |
| ------------- | -------------- | --------------------------------------------------------------------------- | -------------------------------- |
| `scout`       | Haiku (latest) | grep, file location, CI log triage, status checks, summaries                | edits                            |
| `mechanic`    | Haiku (latest) | verbatim copy-deck rows, listed renames, listed test pins, listed deletions | design, new logic, VI/zh wording |
| `implementer` | Sonnet         | one v8 wave: components, CSS, behaviour, tests and a PR                     | review of its own PR             |
| `reviewer`    | Opus           | W11 verification, VI review, truth/security review, red team                | implementation                   |

## Worker lanes: Lead -> Sublead -> subagents (Owner 2026-11-05, 2026-11-08)

Owner 2026-11-08: "Áp dụng FINOPS triệt để Lead -> Sublead điều phối multi
subagent harness (opencode go, escalate claude api, claude sub) tối đa an
toàn, tăng tốc độ xử lý."

| Role     | Who                                                                                     | Does                                                                                                |
| -------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Lead     | Main session (Opus)                                                                     | Plans, splits, reviews every diff, runs gates, merges; keeps copy, design, security, release.       |
| Sublead  | DeepSeek Flash on Go (`opencode-fanout.mjs --split`), Sonnet 5.5 API if Go cannot split | Splits a grunt task into at most 8 self-contained subtasks.                                         |
| Workers  | `lane-dispatch.mjs` per subtask, up to 5 in parallel                                    | Free pool -> Go -> Claude API (Haiku 5.5 for complexity 1-2, Sonnet 5.5 for 3-4, capped) -> exit 4. |
| Fallback | Claude subscription: `mechanic` / `implementer` subagents                               | Only subtasks that exit 4 (no cheap lane answered, cap reached, complexity 5, personal data).       |

1. One task: `node scripts/lane-dispatch.mjs --thread <lane>` with a task
   JSON (`id`, `task`, `complexity` 1-5, `data_class`, `prompt`).
2. Several independent parts:
   `node scripts/opencode-fanout.mjs --thread <lane> --split --escalate`
   (or a JSON task list without `--split`).
3. No paid call wanted: add `--max-lane go`.
4. Exit 4 means the Claude subscription does it: brief `mechanic` or
   `implementer` and say why in the PR or checkpoint.

Delegable tasks: `coding`, `code_review`, `code_test`, `debug`,
`integration`, `technical_docs`. The lead reads every worker diff and runs
the gates; no worker certifies itself, and the maker never judges its own
PR. Never send secrets, visitor data, public copy, product claims, design
decisions or security/release verdicts to any worker lane. Setup, caps and
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
