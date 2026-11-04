# OpenCode Go worker lane

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

A worker never certifies its own output. The lead reads the diff and runs
the repository gates before anything is committed.

## Reuse, do not rewrite

The worker lives in the portfolio framework `blackangelz/blueskyz-studio`
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

## Use (agent)

```bash
git clone --depth 1 https://github.com/blackangelz/blueskyz-studio /home/user/blueskyz-studio
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
`free-pool.json` (seeded from the Sổ Trọ ranking of 2026-11-04; re-rank in
the weekly retro, `.claude/OPERATING_RULES.md` O6).

When a `BlueSkyz-Labs/sgps-core` checkout is present, classify and route each
delegated task with `tools/sgps_model_router.py route` and record the gated
outcome with `record --gate-cmd`, as Sổ Trọ does. The router is a source
overlay and does not change this project's SGPS pin.

## Status

`SOURCE_REUSED`. Measured 2026-11-05 6:55 AM GMT+7 in this cloud environment
with studio `main@69ef9f5`:

- `--status`: slots 1 and 2 `ok`, slot 3 skipped, rotation `on`.
- A real request stopped at `URLError` for DeepSeek and MiMo: the network
  policy blocks `opencode.ai` (proxy `connect_rejected`). The worker failed
  closed without any paid call.

`NOT VERIFIED`: a successful Go or free-pool call from this project. It needs
the network change in Setup step 2.
