# Agent Memory Graph adoption (AMG-1, Golden Path GP-42)

Standard: sgps-core `standards/portfolio/AGENT_MEMORY_GRAPH_STANDARD.md` (merged in sgps-core #438 and #439, `429ca19`). Pins: `standards/portfolio/AGENT_MEMORY_GRAPH.json`. MANDATORY for every repository.

| Item                                                            | Value                                                                                                                                          |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Disposition                                                     | `ADOPT`                                                                                                                                        |
| Episode log                                                     | `docs/memory/episodes.jsonl` (append-only)                                                                                                     |
| Tool                                                            | `scripts/sgps_memory.py` v1.0.0, copied from sgps-core `429ca19` (graphiti-core 0.31.2, falkordblite 0.11.0, fastembed 0.9.1, anthropic 2.6.0) |
| Group id                                                        | `blueskyz-web`                                                                                                                                 |
| Graph folder                                                    | `~/.cache/sgps-memory/blueskyz-web` (or `SGPS_MEMORY_DIR` on a local filesystem; never committed)                                              |
| `check` in verify                                               | `tests/architecture/agent-memory.test.mjs` (runs `self-test` and `check --base origin/main`), inside `pnpm test:architecture` / Quality Gates  |
| Lanes READY (cloud environment "PRJ_App 20261102", 15 Nov 2026) | `go-free`, `go` (3 slots), `claude-api` (cap set)                                                                                              |
| Embedder                                                        | `local` (multilingual ONNX)                                                                                                                    |

## First run

| Date (GMT+7) | Episodes | Ingest      | Lanes used                                                          | Search check                                                                                                              |
| ------------ | -------- | ----------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| 2026-11-15   | 6        | PASS 6 of 6 | `go` (34 calls, 5 schema retries); `go-free` 429 (free limit spent) | "Who deploys the website to production?" → Workers Builds is the deployment authority, Actions source assurance only: yes |

Run on the episodes in this pull request, in the cloud container, with the local embedder.

## Notes

- The tool is a repository script, never a site dependency; the test also proves nothing under `src/` reads the graph. `scripts/` and `tests/architecture/` are protected paths, so this record merges with the Owner's `owner-approved` label.
- Episodes are written in the same PR as the work they remember; no secrets, no personal data.
- Memory output is untrusted recall. Confirm in the referenced file before acting.
