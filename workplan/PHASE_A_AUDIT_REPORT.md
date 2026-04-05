# Phase A — Discovery, Gap Validation, and Data Audit

Date: 2026-03-21  
Status: Completed (Phase B blocked pending user approval)

## Objective
Confirm root causes for missing operational data, identify architecture gaps against mission requirements, and produce a prioritized fix list.

## Audit Coverage
- Environment and Supabase wiring
- Auth/role guard behavior
- Route-level data dependencies and empty states
- Schema readiness for connections, pressure separation, and company-first login
- Existing create/edit capabilities for Admin and Meter Reader

## Findings Summary

| ID | Requirement | Finding | Evidence | Severity | Recommended Fix |
|---|---|---|---|---|---|
| A-01 | Data visible for both roles | Main app dashboard is still static mock data, not live Supabase-backed metrics. | `app/app/(app)/dashboard/page.tsx` imports `dashboardMetrics` from mock data and describes UI-only placeholders. | High | Replace dashboard data source with live role-aware queries and fallback messaging for empty datasets. |
| A-02 | Data visible for both roles | No seed/bootstrap scripts exist in repo for baseline operational data. | No `seed` files found under `app/`; README requires pre-existing account/meter rows. | High | Add idempotent seed scripts and documented execution flow for local/dev/staging. |
| A-03 | Company-first login | Login currently accepts only email/password; no company selection step before role routing. | `app/components/auth/login-form.tsx` has only email/password fields. | High | Introduce tenant/company selection step and bind selected company to session context. |
| A-04 | Map new + existing connections | Current map is display-oriented and lacks create/edit connection workflows. | `app/components/map/pipeline-map-client.tsx` is a UI map shell with filters/details only; no CRUD handlers. | High | Add connection entity + map tools for add/update/list operations with validation. |
| A-05 | Map schema support | No dedicated connections table/entity in schema (accounts currently hold lat/lng directly). | `app/supabase/sql/phase6_schema_storage_rls.sql` defines `accounts.latitude/longitude` but no connection table. | High | Add normalized connection model (account link, coordinates, status, pipeline, audit metadata). |
| A-06 | Separate pressure workflow | Pressure is currently embedded in `readings` submission flow, not a separate operational stream. | `app/app/api/meter-reader/readings/route.ts` stores pressure with meter reading insert. | High | Add separate pressure schema + API + UI flow and keep meter consumption workflow independent. |
| A-07 | Editable dashboards | Admin has bill create/update and anomaly updates, but no account/connection CRUD forms yet. | Admin APIs exist for bills/anomaly; accounts UI is list/detail only. | Medium | Add admin account and connection create/edit forms with role-guarded API routes. |
| A-08 | Meter reader editable options | Meter reader can submit readings, but correction/edit flow for submitted records is missing. | Submit flow exists; no meter-reader update endpoint for prior submission corrections. | Medium | Add controlled correction process (time-windowed edit or admin review/approval). |
| A-09 | Potential no-data root cause | If env vars are missing, app cannot initialize Supabase and login shows configuration error. | `app/lib/supabase/env.ts` and login form guard rely on required env values. | Medium | Add startup diagnostics panel and deployment checklist validation script. |

## Route and Data Dependency Matrix (Current State)

| Route | Data Source | Status |
|---|---|---|
| `/dashboard` | `lib/mock-data/data` | Mock-only (not operational) |
| `/meter-reader/search` | `/api/meter-reader/account-lookup` + Supabase | Live, requires existing accounts/readings |
| `/meter-reader/submit` | `/api/meter-reader/readings` + storage | Live, combined reading+pressure |
| `/admin/accounts` | `fetchAdminAccountsData()` + Supabase | Live list/details, no CRUD forms |
| `/admin/bills` | Supabase + admin bill APIs | Live with create/status updates |
| `/admin/users` | `fetchAdminReaderActivityData()` + Supabase | Live (dependent on profiles/readings) |
| `/map` | `fetchMapDataset()` + display client | Live display data, no connection CRUD |
| `/reports` | `fetchReportsDataset()` + Supabase | Live reporting/anomaly update |
| `/login` | Supabase email/password auth | Live, no company-first step |

## Phase A Evidence Checklist
- [x] Reviewed environment variable requirements.
- [x] Reviewed role guard patterns in API routes.
- [x] Reviewed schema for connection and pressure separation support.
- [x] Reviewed primary role routes for data dependencies.
- [x] Executed runtime verification in local environment (lint, typecheck, tests, build, route/API guard checks).
- [x] Captured baseline API response evidence for route guards and protected endpoints.

## Runtime Evidence Snapshot
- `GET /dashboard` (unauthenticated) returned `307` redirect to `/login`.
- `GET /api/meter-reader/account-lookup?accountNumber=ACC-1001` (unauthenticated) returned `401` with `{"message":"Unauthorized"}`.
- `POST /api/admin/bills` (unauthenticated) returned `401` with `{"message":"Unauthorized"}`.
- Local quality/build verification passed: `npm.cmd run lint`, `npm.cmd run typecheck`, `npm.cmd run test`, `npm.cmd run build`.

## Decision Log for Next Implementation Steps (After Approval)
1. Replace mock dashboard with role-aware live metrics endpoint.
2. Introduce seed script package and operator run command.
3. Add company-first auth pre-step and tenant context enforcement.
4. Add connection model + map CRUD workflow.
5. Split pressure capture into dedicated workflow and persistence model.

## Gate
Phase B is intentionally blocked until user approval is provided.
