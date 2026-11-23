# Vendored upstream product profiles

Byte-for-byte snapshots of the canonical public profile each product repository owns. The website mirrors them and fails on drift (`tests/architecture/sotro-public-profile-drift.test.mjs`).

| Field             | Value                                                         |
| ----------------- | ------------------------------------------------------------- |
| Snapshot file     | `sotro.public-profile.json` (schema `sotro-public-profile/1`) |
| Source repository | `BlueSkyz-Labs/Sotro` (private)                               |
| Source path       | `docs/product/public-profile.json`                            |
| Upstream revision | `d29b76156a73bea2c4466166cb221dd2de71b8c9`                    |
| Upstream branch   | PENDING: head of BlueSkyz-Labs/Sotro#2427, re-pin to `main`   |
| Date vendored     | 2026-11-23                                                    |
| Pin status        | PINNED to the Sotro `main` squash SHA.                        |

## Rule

Change the upstream first, then re-vendor. Never edit the snapshot here, and never change a Sổ Trọ public claim in `src/content/products/sotro.yaml` without a matching upstream profile change.

To re-vendor: copy the file byte-for-byte from the new Sotro revision, update `Upstream revision` above and `sourceRevision` in `src/content/products/sotro.yaml` to the same SHA, then align the record with the profile until the drift test passes.

## Why this is not under `src/content/products/`

`src/content.config.ts` loads every `*.json` under `src/content/products` as a product record, and `scripts/check-product-provenance.mjs` scans them too. A profile snapshot is not a product record, so it lives here, outside both.

The drift test reads the `Upstream revision` row above; keep its format.
