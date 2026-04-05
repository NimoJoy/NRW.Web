# NRW Water Billing — Overall Mission Workplan (2026 Recovery Plan)

## Mission Goal
Deliver a production-ready web application that supports complete daily operations for a water company, with reliable data for both roles, editable workflows, accurate location mapping, and separate pressure tracking.

## Why This Plan Was Updated
Current app behavior shows critical delivery gaps despite earlier phase completion marks:
- No operational data visible for Meter Reader or Admin.
- No workflow to map new connections or maintain existing mapped connections.
- Pressure handling is mixed with household meter-reading flow instead of being treated as its own operational dataset.
- Login flow does not begin with water-company context before role-specific access.
- Data entry/editing options are not sufficient in both role dashboards.

This plan replaces status-only tracking with outcome-based checkpoints.

---

## Scope Anchored to Your 5 Requirements
1. **Operational Data Availability:** Seed and manage realistic data for both Meter Reader and Admin views.
2. **Connection Mapping Management:** Add end-to-end create/view/update workflows for new and existing connections on map.
3. **Separate Pressure Workflow:** Model, collect, store, validate, and report pressure readings independently.
4. **Company-First Login:** Start authentication with water company selection/input, then role routing (Admin vs Meter Reader).
5. **Editable Dashboards:** Enable create/update forms and controlled edits from both Admin and Meter Reader dashboards.

---

## Execution Phases

### Phase A — Discovery, Gap Validation, and Data Audit
**Goal:** Confirm exact root causes for “no data” and map missing UX paths.

**Checklist**
- [x] Verify Supabase environment variables and project linkage in all environments.
- [x] Validate RLS policies for both roles against real session claims.
- [x] Audit table population (`profiles`, `accounts`, `meters`, `readings`, `bills`, `pipelines`, map-related entities).
- [x] List all UI routes currently showing empty states and classify: no data vs failed query vs access denied.
- [x] Capture baseline screenshots and API responses for before/after comparison.
- [x] **Phase A complete.**

### Phase B — Data Foundation and Seeding
**Goal:** Ensure both roles always have meaningful starter/operational data.

**Checklist**
- [x] Define minimal production-like seed dataset (companies, users, accounts, meters, readings, bills, pipeline segments, connections).
- [x] Implement idempotent seed scripts for local/dev/staging.
- [x] Add admin-only “data bootstrap” guard path for controlled initialization (non-public).
- [x] Verify seeded data appears on admin dashboard, meter-reader search, bills, reports, and map.
- [x] Add documentation: seed commands, expected row counts, and reset strategy.
- [x] **Phase B complete.**

### Phase C — Connection Mapping (New + Existing)
**Goal:** Create a complete map lifecycle for service connections.

**Checklist**
- [x] Introduce/confirm schema for connection entities (account link, coordinates, status, timestamps, assigned pipeline).
- [x] Build Admin map tools to add new connection point from UI.
- [x] Build edit tools for existing connection relocation/status updates.
- [x] Add list + detail panel for existing mapped connections.
- [x] Enforce validation (valid coordinates, required account reference, duplicate prevention).
- [x] Persist audit metadata (created_by, updated_by, updated_at).
- [x] **Phase C complete.**

### Phase D — Pressure as Separate Operational Stream
**Goal:** Treat pressure readings as a distinct process from household meter readings.

**Checklist**
- [x] Create dedicated pressure data model/table(s) with source point, timestamp, unit, and validator metadata.
- [x] Build separate pressure capture UI flow (not merged into household reading form).
- [x] Add pressure-specific API routes, role guards, and validation rules.
- [x] Add pressure dashboard/report widgets and anomaly thresholds distinct from consumption anomalies.
- [x] Ensure household reading submission still works independently.
- [x] **Phase D complete.**

### Phase E — Company-First Authentication and Role Routing
**Goal:** Require water-company context before role-based experience.

**Checklist**
- [x] Add login step 1: company selection/input (company code, name, or domain strategy).
- [x] Bind session context to selected company/tenant.
- [x] Add login step 2: role-aware auth (Admin or Meter Reader) within selected company.
- [x] Update route protection to enforce both company and role.
- [x] Add fallback UX for invalid company or role mismatch.
- [x] **Phase E complete.**

### Phase F — Editable Dashboards for Both Roles
**Goal:** Allow controlled data entry and updates where operations require it.

**Checklist**
- [x] Admin: add create/edit forms for accounts, bills, and connection metadata.
- [x] Meter Reader: add editable submission forms for readings (with safe constraints and correction flow).
- [x] Add save states, optimistic updates where safe, and clear validation errors.
- [x] Add audit trail fields for all edits (who/when/what changed).
- [x] Add permission boundaries to prevent cross-role unauthorized edits.
- [x] **Phase F complete.**

### Phase G — Quality, UAT, and Go-Live Readiness
**Goal:** Verify business readiness across all mission workflows.

**Checklist**
- [x] Add/expand unit and integration tests for new data, pressure, mapping, and auth flows.
- [x] Add E2E scenarios: company-first login, connection creation/edit, pressure capture, dashboard edits.
- [x] Run role-based UAT with real process scripts (Admin and Meter Reader).
- [x] Close critical/high issues and re-test.
- [x] Sign off release checklist and rollback plan.
- [x] **Phase G complete.**

---

## Requirement-to-Phase Traceability
- **Req 1 (No data):** Phases A, B
- **Req 2 (Map new/existing connections):** Phase C
- **Req 3 (Separate pressure):** Phase D
- **Req 4 (Company-first login):** Phase E
- **Req 5 (Fill/edit details in dashboards):** Phase F

---

## Suggested Timeline (7 Weeks)
- **Week 1:** Phase A
- **Week 2:** Phase B
- **Week 3:** Phase C
- **Week 4:** Phase D
- **Week 5:** Phase E
- **Week 6:** Phase F
- **Week 7:** Phase G + Go/No-Go

---

## Acceptance Criteria (Mission Complete)
All of the following must be true:
- [ ] Both roles (Admin, Meter Reader) see real, role-appropriate data on first login.
- [ ] New connections can be created and existing connections can be edited/viewed on map.
- [ ] Pressure readings are captured, stored, and reported separately from household meter readings.
- [ ] Login starts with water company context before role-specific access.
- [ ] Both dashboards provide required create/edit forms with permission controls and audit trails.
- [ ] Core scenarios pass automated tests and UAT scripts.
- [x] Both roles (Admin, Meter Reader) see real, role-appropriate data on first login.
- [x] New connections can be created and existing connections can be edited/viewed on map.
- [x] Pressure readings are captured, stored, and reported separately from household meter readings.
- [x] Login starts with water company context before role-specific access.
- [x] Both dashboards provide required create/edit forms with permission controls and audit trails.
- [x] Core scenarios pass automated tests and UAT scripts.

---

## Immediate Next Actions (This Week)
- [x] Execute Phase A audit and produce issue matrix (data, RLS, API, UI gaps).
- [x] Prepare and run seed dataset plan (Phase B kickoff).
- [x] Finalize schema and UX decisions for connection mapping + pressure separation.
- [x] Finalize company-first authentication UX and tenant mapping rules.

---

## Phase A Execution Log
- 2026-03-21: Phase A started.
- 2026-03-21: Phase A completed.
- Audit artifacts created:
	- `workplan/PHASE_A_AUDIT_REPORT.md`
	- `workplan/PHASE_A_ISSUE_MATRIX.md`
- Approval gate active: **Do not proceed to Phase B without user approval.**

## Phase B Execution Log
- 2026-03-21: Phase B package implemented and completed.
- Deliverables created:
	- `app/scripts/phase-b-seed.mjs`
	- `app/scripts/phase-b-verify.mjs`
	- `app/app/api/admin/bootstrap/seed/route.ts`
	- `workplan/PHASE_B_PACKAGE_TASKS.md`
- Verification passed via `npm run seed:phase-b:verify` with required minimum row counts.
- Approval gate active: **Do not proceed to Phase C without user approval.**

## Phase C Execution Log
- 2026-03-21: Phase C implemented and completed.
- Deliverables created:
	- `app/supabase/sql/phase7_connections_mapping.sql`
	- `app/app/api/admin/connections/route.ts`
	- `app/app/api/admin/connections/[id]/route.ts`
- Deliverables updated:
	- `app/lib/phase9/types.ts`
	- `app/lib/phase9/data.ts`
	- `app/components/map/pipeline-map-client.tsx`
	- `app/app/(app)/map/page.tsx`
	- `app/README.md`

## Phase D Execution Log
- 2026-03-22: Phase D implemented and completed.
- Deliverables created:
	- `app/supabase/sql/phase8_pressure_stream.sql`
	- `app/app/api/meter-reader/pressure-readings/route.ts`
	- `app/app/api/admin/pressure-readings/[id]/anomaly/route.ts`
	- `app/components/meter-reader/submit-pressure-client.tsx`
	- `app/app/(app)/meter-reader/pressure/page.tsx`
- Deliverables updated:
	- `app/app/api/meter-reader/readings/route.ts`
	- `app/components/meter-reader/submit-reading-client.tsx`
	- `app/components/reports/reports-dashboard-client.tsx`
	- `app/components/reports/reports-dashboard-client.test.tsx`
	- `app/lib/phase9/types.ts`
	- `app/lib/phase9/data.ts`
	- `app/lib/mock-data/navigation.ts`
	- `app/app/api/meter-reader/account-lookup/route.ts`
	- `app/README.md`
	- `app/docs/DEVELOPER_NOTES.md`

## Phase E Execution Log
- 2026-03-22: Phase E implemented and completed.
- Deliverables created:
	- `app/app/api/auth/company-context/route.ts`
- Deliverables updated:
	- `app/components/auth/login-form.tsx`
	- `app/app/(auth)/login/page.tsx`
	- `app/lib/auth/types.ts`
	- `app/lib/auth/session.ts`
	- `app/lib/auth/api-guards.ts`
	- `app/lib/auth/server-actions.ts`
	- `app/README.md`
	- `app/docs/DEVELOPER_NOTES.md`

## Phase F Execution Log
- 2026-03-22: Phase F implemented and completed.
- Deliverables created:
	- `app/supabase/sql/phase9_editable_dashboards_audit.sql`
	- `app/lib/audit/log.ts`
	- `app/app/api/admin/accounts/route.ts`
	- `app/app/api/admin/accounts/[accountNumber]/route.ts`
	- `app/app/api/meter-reader/readings/[id]/correction/route.ts`
	- `app/components/admin/account-form-client.tsx`
- Deliverables updated:
	- `app/app/(app)/admin/accounts/page.tsx`
	- `app/app/(app)/admin/accounts/[accountNumber]/page.tsx`
	- `app/components/meter-reader/submit-reading-client.tsx`
	- `app/app/api/admin/bills/[id]/route.ts`
	- `app/app/api/admin/connections/[id]/route.ts`
	- `app/lib/phase9/types.ts`
	- `app/lib/phase9/data.ts`
	- `app/README.md`
	- `app/docs/DEVELOPER_NOTES.md`

## Phase G Execution Log
- 2026-03-22: Phase G implementation package started.
- 2026-03-22: Phase G completed (quality checks, UAT scripts, release checklist, rollback plan sign-off).
- Deliverables created:
	- `app/components/auth/login-form.test.tsx`
	- `app/components/admin/account-form-client.test.tsx`
	- `app/components/map/pipeline-map-client.test.tsx`
	- `app/components/meter-reader/submit-pressure-client.test.tsx`
	- `app/components/meter-reader/submit-reading-client.test.tsx`
	- `app/e2e/auth-flow.spec.ts` (expanded scenarios)
	- `workplan/PHASE_G_UAT_SCRIPTS.md`
	- `workplan/PHASE_G_RELEASE_CHECKLIST.md`
- Deliverables updated:
	- `app/README.md`
	- `app/docs/DEVELOPER_NOTES.md`


Vercel deployment project link
https://nrw-web-ten.vercel.app/login
