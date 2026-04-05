# Phase G UAT Scripts

Date: 2026-03-22
Owners: Product + Operations + Engineering

## Preconditions

- Supabase migrations applied through Phase F, including:
  - `app/supabase/sql/phase8_pressure_stream.sql`
  - `app/supabase/sql/phase9_editable_dashboards_audit.sql`
- Seed data present (`npm run seed:phase-b` + verify command).
- Two test users available:
  - Admin user (`app_metadata.role = admin`, `profiles.org_id = NRW-WATER-001`)
  - Meter reader user (`app_metadata.role = meter_reader`, `profiles.org_id = NRW-WATER-001`)

## Script A — Admin UAT (Connection + Dashboard Edits)

1. Sign in via company-first login (`/login`):
   - Select `NRW Water Utility (NRW-WATER-001)`.
   - Continue to credential step and authenticate as admin.
2. Open map (`/map`):
   - Add a new connection for an unmapped account.
   - Confirm success state and refresh rendering.
3. Edit an existing connection:
   - Change coordinates and status.
   - Save and verify updated connection details card.
4. Open admin accounts (`/admin/accounts`):
   - Create a new account with required fields.
   - Verify account appears in list.
5. Open account details (`/admin/accounts/{accountNumber}`):
   - Edit customer name/status/address/pipeline and save.
6. Validation:
   - Check `audit_logs` entries exist for account create/update and connection update.
   - Confirm actor id equals current admin user id.

## Script B — Meter Reader UAT (Pressure + Reading Correction)

1. Sign in via company-first login (`/login`) as meter reader.
2. Open pressure page (`/meter-reader/pressure`):
   - Submit a pressure reading with value and note.
   - Verify summary card shows persisted value and anomaly state.
3. Open reading submit page (`/meter-reader/submit`):
   - Submit a household reading with photo upload.
   - Confirm summary shows saved reading id and consumption.
4. Execute correction flow:
   - Apply corrected current reading with mandatory reason.
   - Confirm success state and updated consumption.
5. Validation:
   - Verify correction rejected when value < previous reading.
   - Verify correction rejected for missing reason.
   - Verify correction is logged in `audit_logs`.

## Defect triage protocol

- Severity 1/2 defects block release.
- Reproduce, capture route + payload + user role + company context.
- Fix branch must include automated test coverage for discovered regression.
- Re-run `npm run check` and targeted Playwright scenario before closure.