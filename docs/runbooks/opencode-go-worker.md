# Worker lanes: OpenCode Go, free pool, Claude API

Owner request (Tony, 2026-11-05 6:47 AM GMT+7): learn how Sổ Trọ uses OpenCode
Go and bring the same mechanism into this repository's harness and
orchestration flow. Source of the mechanism:
`BlueSkyz-Labs/sotro` `docs/runbooks/OPENCODE_GO_WORKER.md` and
`docs/governance/OWNER_DELIVERY_OPERATING_MODEL.md` §1a (M1–M8).

## Roles

- **Claude lead** (main session): plans, splits work, reviews every diff,
  runs the gates, merges. Keeps everything listed under "Never send" below.
- **DeepSeek Flash on OpenCode Go** (worker and fan-out sub-lead): drafts
  machine-checkable engineering work and splits multi-part grunt tasks.
- **Free OpenCode Zen pool** (sub-agents): runs the split subtasks in
  parallel before Go is used.

- **Claude API** (paid escalation, capped): Haiku 5.5 for complexity 1-2,
  Sonnet 5.5 for 3-4 (with server-side refusal fallbacks), only after the
  free pool and Go produced nothing.
- **Claude subscription** (last): the lead or its `mechanic` / `implementer`
  subagents, for anything a cheaper lane could not or may not do.

Owner request 2026-11-08 12:27 PM GMT+7 ("Áp dụng FINOPS triệt để Lead ->
Sublead điều phối multi subagent harness (opencode go, escalate claude api,
claude sub) tối đa an toàn, tăng tốc độ xử lý") added the Claude API step,
`scripts/lane-dispatch.mjs` and `opencode-fanout.mjs --escalate`.

A worker never certifies its own output. The lead reads the diff and runs
the repository gates before anything is committed.

## Reuse, do not rewrite

The worker lives in the portfolio framework `BlueSkyz-Labs/blueskyz-studio`
(one source, changed by PR there):

| Studio file                             | Role                                                                                                 |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `framework/finops/go_first.py`          | DeepSeek Flash latest; MiMo Flash only on transient 408/5xx/network faults. Never calls paid Claude. |
| `framework/finops/go_credentials.py`    | 3-key pool with `OPENCODE_GO_ROTATION_MODE=on`; 429 and 401/403 put a key in cooldown.               |
| `framework/finops/guard/spend_guard.py` | Spend ledger, caps, secret block, `billing_source` check.                                            |

This repository adds thin adapters only:

| File                                               | Role                                                                                                                                                |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `scripts/opencode-go-worker.mjs`                   | Runs `go_first.py` as brand `blueskyz-web`; `--status` shows slots without a request and without key values.                                        |
| `scripts/opencode-free-worker.mjs`                 | Tries the free pool through the OpenCode CLI (locked: no edit, no shell, no web fetch), then Go with `--fallback-go`.                               |
| `scripts/opencode-fanout.mjs`                      | DeepSeek Flash splits a task into at most 8 subtasks (`--split`) or takes a JSON list; up to 5 run in parallel, each starting on a different model. |
| `tests/architecture/opencode-worker-lane.test.mjs` | Offline proof with a fake studio worker and a fake CLI; no network, no key values.                                                                  |

Every adapter refuses a prompt that looks like it holds a secret, an
OpenCode key value, a 12-digit id number, a Vietnamese phone number or a
personal email address. Allowed `--task`: `coding`, `code_review`,
`code_test`, `debug`, `integration`, `technical_docs`. Allowed
`--data-class`: `synthetic`, `public`, `internal_non_sensitive`; free models
without zero data retention (`privacy: "zdr"`) get only `public` or
`synthetic`.

Slot 3 is skipped by default: that account has no active Go plan (Sổ Trọ
measurement, Owner decision 2026-11-04 not to buy one). Set
`BLUESKYZ_WEB_GO_DISABLED_SLOTS=""` to use it again.

## Never send to Go or the free pool

Secrets or key values; visitor or customer data; public copy, legal text,
product claims or anything a customer reads (`PUBLIC_CONTENT_STANDARD.md`
requires Claude authorship plus an independent review); security, release or
assurance verdicts; brand-kit and visual design decisions. The studio guard
also blocks purposes containing `publish`, `release`, `customer`, `final` or
`policy`.

## Setup (Owner)

1. Cloud environment variables (values only the Owner enters):
   `OPENCODE_GO_API_KEY_1..3`, `OPENCODE_GO_ALLOWANCE_SCOPE_1..3` (distinct,
   non-secret labels such as `go-sub-1`), `OPENCODE_GO_ROTATION_MODE=on`.
   Present in the environment as of 2026-11-05 (names checked, values not read).
2. Network access: add `opencode.ai` and `models.opencode.ai` under Allowed
   domains, keep Allow package managers ticked.
   https://code.claude.com/docs/en/cloud-environments#network-access
3. OpenCode console: Privacy › Regions set to Global (required for DeepSeek);
   Extra Usage off.
4. Claude API: `CLAUDE_API_KEY` (present 2026-11-08, value not read). The
   key is not scoped to one workspace, so the API also needs
   a workspace id (a `wrkspc_…` id, not a secret). The worker reads
   `CLAUDE_API_WORKSPACE_ID`, then `CLAUDE_WORKSPACE_ID` /
   `ANTHROPIC_WORKSPACE_ID`, and otherwise uses the portfolio workspace
   recorded in sgps-core, so nothing needs to be set for the default. Caps (USD, ledger estimate) default to
   0.5 per call, 5 per day, 50 per month; change them with
   `BLUESKYZ_WEB_CLAUDE_API_{CALL,DAY,MONTH}_USD`.

## Use (agent)

```bash
git clone --depth 1 https://github.com/BlueSkyz-Labs/blueskyz-studio /home/user/blueskyz-studio
node scripts/opencode-go-worker.mjs --status
echo "Write a node:test for scripts/check-static-links.mjs ..." \
  | node scripts/opencode-go-worker.mjs --thread lane-links-test --task code_test

# Free pool first, then Go (OpenCode CLI installed locally, not globally)
npm i --prefix "$SCRATCH/oc" opencode-ai@1.19.5
echo "<prompt>" | OPENCODE_BIN="$SCRATCH/oc/node_modules/.bin/opencode" \
  node scripts/opencode-free-worker.mjs --thread lane-x --task coding --fallback-go

# Multi-part grunt work
node scripts/opencode-fanout.mjs --thread lane-x --split --fallback-go < task.txt > out.json
```

Exit 0 means a draft is on stdout. Any other exit means the cheap lane is not
available (no quota, key refused, network blocked, billed balance): the lead
does the work or hands it to a Claude lane. There is no automatic paid
fallback.

Ledger and state live in `/mnt/project-files/BLUESKYZ_WEB_FINOPS/`:
`go-calls.jsonl` (append-only, no prompt or output), `go-rotation.json`,
`free-pool.json` (re-rank in the weekly retro, `.claude/OPERATING_RULES.md`
O6). When that file is missing, as in a new project environment, the free
worker reads the committed seed `docs/finops/free-pool.seed.json`.

In a project environment the studio repository has to be on the project's
repository list (or attached to the session) before it can be cloned; a
missing clone makes the Go lane exit 2 with the clone command.

When a `BlueSkyz-Labs/sgps-core` checkout is present, classify and route each
delegated task with `tools/sgps_model_router.py route` and record the gated
outcome with `record --gate-cmd`, as Sổ Trọ does. The router is a source
overlay and does not change this project's SGPS pin.

## Escalation chain (agent)

```bash
# One task, cheapest lane first; exit 4 = do it on the Claude subscription
echo '{"id":"links-test","task":"code_test","complexity":2,"data_class":"internal_non_sensitive","prompt":"..."}' \
  | node scripts/lane-dispatch.mjs --thread lane-links

# Many parts in parallel: Go splits (Sonnet API if Go cannot), each part runs the chain
node scripts/opencode-fanout.mjs --thread lane-x --split --escalate --complexity 2 < task.txt > out.json

# Never pay: stop after Go
node scripts/lane-dispatch.mjs --thread lane-x --max-lane go < task.json
```

| Exit | Meaning                                                                                                                 |
| ---- | ----------------------------------------------------------------------------------------------------------------------- |
| 0    | A cheap lane returned a draft (JSON `lane` says which).                                                                 |
| 4    | Hand to the Claude subscription: no lane answered, cap reached, complexity 5, personal data or a task outside the list. |
| 5    | Blocked: `data_class` `secret` or `unknown`.                                                                            |
| 2    | Refused (secret, key value or personal data in the prompt) or bad input.                                                |

Routing rules: complexity 1-3 starts on the free pool, 4 starts on Go;
complexity 5 and personal data skip straight to the lead. The Claude API
worker reserves the worst-case cost under a lock before each call, so
parallel subtasks cannot overshoot a cap, then writes the settled cost from
the response usage. Ledgers in `/mnt/project-files/BLUESKYZ_WEB_FINOPS/`:
`claude-api-calls.jsonl` (cost, tokens, no prompt or output) and
`route-log.jsonl` (lanes tried per task).

## Status

`SOURCE_REUSED`. Measured 2026-11-05 6:55 AM GMT+7 in this cloud environment
with studio `main@69ef9f5`:

- `--status`: slots 1 and 2 `ok`, slot 3 skipped, rotation `on`.
- A real request stopped at `URLError` for DeepSeek and MiMo: the network
  policy blocks `opencode.ai` (proxy `connect_rejected`). The worker failed
  closed without any paid call.

Claude API, 2026-11-08 12:33 PM GMT+7: the key authenticates, but the API
returned 400 "This API key is not scoped to a workspace, so this request
must include the anthropic-workspace-id header". The worker failed closed
and kept the reservation ($0.008) in the ledger. Offline tests
(`tests/architecture/lane-dispatch.test.mjs`) prove the chain, caps,
workspace header and fan-out against a local fake API.

`NOT VERIFIED`: a successful Go or free-pool call (needs Setup step 2) and a
successful Claude API call (needs Setup step 4).
