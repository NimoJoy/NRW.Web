# Phase B Package Tasks — Data Foundation and Seeding

Date: 2026-03-21  
Status: Completed

## Package Objective
Deliver repeatable, idempotent data bootstrap for local/dev/staging and verify data visibility readiness for Admin and Meter Reader flows.

## Task Package

### 1) Define minimal production-like dataset
- [x] Organization context (`org_id`) baseline defined.
- [x] Seed user set defined (admin + meter reader).
- [x] Seed entities defined for pipelines, accounts, meters, readings, and bills.

### 2) Implement idempotent seed scripts
- [x] Added CLI seed script: `npm run seed:phase-b`.
- [x] Added CLI verification script: `npm run seed:phase-b:verify`.
- [x] Implemented upsert-based/idempotent writes for mutable entities.
- [x] Implemented duplicate-safe reading inserts by `(account_number, recorded_at)` lookup.

### 3) Add admin-only non-public bootstrap path
- [x] Added `POST /api/admin/bootstrap/seed`.
- [x] Enforced `admin` role guard.
- [x] Enforced `x-bootstrap-token` header against `PHASE_B_BOOTSTRAP_TOKEN`.

### 4) Verify seeded data appears in role workflows
- [x] Seed verification script validates required table thresholds.
- [x] Baseline map-readiness check validates mapped account coordinates.

### 5) Documentation and handover
- [x] Updated `app/README.md` with seed commands, expected counts, and reset strategy.

## Deliverables
- CLI scripts:
  - `app/scripts/phase-b-seed.mjs`
  - `app/scripts/phase-b-verify.mjs`
- API route:
  - `app/app/api/admin/bootstrap/seed/route.ts`
- Run scripts:
  - `seed:phase-b`
  - `seed:phase-b:verify`

## Expected Baseline Counts
- profiles: >= 2
- pipelines: >= 2
- accounts: >= 4
- meters: >= 4
- readings: >= 4
- bills: >= 4
- mapped connections (accounts with lat/lng): >= 4

## Gate
Phase C must not begin until user approval is provided.
