---
name: Gudang Stok Bug
description: Why the stok tab always showed empty and how the three-part fix works.
---

## The Problem
`POST /bahan-baku` inserted into `bahanBakuTable` but never created a corresponding row in `stokTable`. Result: the Gudang "Stok Saat Ini" tab was always empty for any freshly added ingredient, even after penerimaan was recorded.

## The Fix (three parts)

1. **POST /bahan-baku** now also runs:
   ```ts
   await db.insert(stokTable).values({ bahan_baku_id: b.id, kuantitas: "0" }).onConflictDoNothing();
   ```

2. **GET /stok** now backfills: scans for bahan_baku rows with no matching stok row and inserts `kuantitas=0` for each — fixes existing data without a migration.

3. **PATCH /stok/:bahan_baku_id** (new endpoint) performs an upsert — update if exists, insert if not — enabling manual stock adjustments from the UI.

## Why
The stok schema has a `UNIQUE` constraint on `bahan_baku_id`, so `onConflictDoNothing()` is safe to call multiple times.

**How to apply:** Any future route that creates a `bahan_baku` row must also create the stok row. Any future route that deletes a `bahan_baku` row should also delete the matching stok row (already handled in DELETE /bahan-baku).
