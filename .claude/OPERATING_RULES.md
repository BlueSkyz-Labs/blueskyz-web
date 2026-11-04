# Operating rules (durable, every session)

Owner request 2026-10-21: optimise dev and delivery time, learn from real
operation on a regular cycle, use harness/multi-agent orchestration and
FinOps, and keep these rules across session and container resets. This file
is the durable copy. It sits beneath Safety/Policy, SGPS, Product Truth and
the active plan (AGENTS.md precedence); it changes only by a protected PR.

## O1. Communication

- Talk to the Owner in Vietnamese; technical terms stay in English.
- Every time shown to the Owner is GMT+7 (`Asia/Ho_Chi_Minh`), 12-hour
  AM/PM, e.g. `7:59 AM GMT+7`. Convert UTC before reporting.
- Conclusion first, then reasons. Name the weakest point of your own
  recommendation. When the data cannot support a conclusion, say so.
- Repository artifacts (code, commits, PRs, docs) stay in English.

## O2. Flow (measured baseline 2026-10-21)

Baseline from the last 60 `Quality Gates` runs: median CI wall time 39 min;
critical path webkit shard 33 min (firefox 26, mobile-chromium 22,
chromium 17); 17 of 60 runs cancelled (28%) by superseding pushes; PR lead
time median 3.5 h, p90 43 h (dominated by the `owner-approved` wait).

- firefox and webkit run as two Playwright shards each
  (`E2E_SHARD`, guarded by `tests/architecture/browser-assurance-matrix.test.mjs`).
  Re-measure after the change; keep it only if the critical path drops.
- One validated push per round: run the local gate first, push once. Do not
  push again while a run is in flight unless the head is already known bad.
- Merge one PR at a time at the pinned head with 8/8 green and
  `behind_by == 0`. Merge PRs that share no visual baselines first; PRs that
  share baselines go last, each re-merging `main` after the previous lands.
- Batch protected-path changes so the Owner labels once per wave; list every
  link in one message.
- Split a PR only when the halves are file-disjoint.
- Visual baselines come only from the CI `visual-gate-diffs` artifact
  (`*-actual.png`, not `retry`), after inspecting the diff image.
- PROPOSED (needs Owner + provider change, not done): a GitHub merge queue.
  It needs a `merge_group` trigger on every required workflow, the
  merge-policy job handling that event, and a ruleset change. Source:
  https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-a-merge-queue

## O3. Local hygiene

- Port 3000 must be free before a local browser run;
  `reuseExistingServer: false` makes a busy port fail the run
  (LSN-marketing-002).
- Kill only exact processes (match `astro.mjs preview`, skip your own shell).
  Never `pkill -f` a generic pattern.
- Local visual parity is never evidence; CI on the exact head is.

## O4. Harness and multi-agent

- Route lanes by `.claude/AGENT_ROUTING.md`: scout for lookups, mechanic for
  exact edits, implementer for a wave, reviewer as the independent judge.
  The maker never judges its own PR.
- One git worktree per PR; never share a working tree between agents.
- Prefer events (PR subscriptions, task notifications) over polling.
  Self check-ins back off 50 min -> 2 h -> 4 h and stop after three empty
  ones while nothing is open.
- Brief agents with exact paths, SHAs and acceptance checks so they do not
  re-derive context.

## O5. FinOps

- Use the cheapest sufficient model per lane (AGENT_ROUTING.md). Grunt work
  goes to the OpenCode Go / free-pool worker lane first
  (`docs/runbooks/opencode-go-worker.md`); there is no automatic paid
  fallback.
- The repository is public: standard GitHub-hosted runners are free, so
  optimise wall time and parallelism, not minutes. Larger runners are always
  billed and need the Owner, as does any new paid service. Sources:
  https://docs.github.com/en/actions/concepts/billing-and-usage and
  https://docs.github.com/en/billing/reference/actions-runner-pricing
- Cut cancelled-run waste (O2). Keep prompts and tool output small: read the
  part of a file you need, summarise logs instead of pasting them.

## O6. Learning loop

- Capture each lesson as `docs/lessons/LSN-marketing-<nnn>.json` per the
  SGPS `lesson-capture` skill (SGPS-DEC-2026-035), validated with
  `sgps_lessons.py validate`. A recurrence escalates the guard in the same
  fix PR.
- Weekly retro (Monday morning GMT+7, scheduled task): compute flow metrics
  (SGPS-DEC-2026-034 R9: CI wall time, critical shard, cancel rate, lead
  time, red-on-first-push rate) against this baseline, review lessons, pick at
  most three improvements, ship the safe ones as PRs, report to the Owner in
  Vietnamese with GMT+7 times.
- These rules change only through a protected PR with the Owner's label.

## O7. Public content (Owner, 2026-10-25)

- Every article and customer-facing sentence meets
  `docs/editorial/PUBLIC_CONTENT_STANDARD.md` and the journal press standard.
  The bar is a top-tier global publication; the words "top tier" or "elite"
  are never printed about ourselves.
- Before publication: an independent copy review (reviewer lane or a person
  who did not write it), findings resolved, Owner approval of the post.
- After publication: read the live page in every language within 24 hours of
  the deploy and fix what is wrong in a follow-up PR; re-read when a cited
  fact changes and at least quarterly.
