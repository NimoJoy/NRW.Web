# NRW Water Billing App

Next.js + Supabase project for water billing workflows with two roles:

- `admin`
- `meter_reader`

Phase 3 implementation in this repo includes:

- Supabase login/logout
- Session-protected app routes
- Role-based route guards
- Company-first login context (Phase E)
- Profile bootstrap (`profiles` table lookup/create on first login)

## Company-first authentication (Phase E)

Phase E adds tenant/company context before role-specific app access:

- Login step 1 requires water company selection.
- Login step 2 authenticates with email/password and binds selected company to session cookie context.
- Page/layout guards now enforce both:
  - authenticated user + role
  - selected company context matching `profiles.org_id`
- API guards also enforce company context before role checks.

Fallback behavior:

- Missing/invalid company context redirects to `/login?reason=company-context-required`.
- Role mismatch redirects to `/login?reason=role-mismatch`.

## Editable dashboards (Phase F)

Phase F adds controlled edit flows for both roles:

- Admin accounts dashboard now includes:
  - account create form (`POST /api/admin/accounts`)
  - account edit form (`PATCH /api/admin/accounts/[accountNumber]`)
- Meter reader submission flow now includes correction path:
  - `PATCH /api/meter-reader/readings/[id]/correction`
  - meter readers can correct only their own readings within 24 hours

Audit logging:

- Edits are captured to `audit_logs` with actor/time/old/new values.
- Apply `supabase/sql/phase9_editable_dashboards_audit.sql` to enable the audit table and RLS.

## Quality and UAT package (Phase G)

Phase G extends readiness verification across auth, mapping, pressure, and editable workflows:

- Added component tests for:
  - company-first login step progression
  - admin account create/edit form behavior
  - map connection create/edit interactions
  - pressure submission flow
  - reading correction flow
- Expanded Playwright scenarios for:
  - company-first login progression
  - protected route redirects across map, pressure, and dashboard edit surfaces
  - company-context-required messaging
- Added role-based UAT scripts and release rollback checklist:
  - `workplan/PHASE_G_UAT_SCRIPTS.md`
  - `workplan/PHASE_G_RELEASE_CHECKLIST.md`

## Prerequisites

- Node.js 20+
- A Supabase project

## Environment setup

1. Copy `.env.local.example` to `.env.local`
2. Set values:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GIS_PIPELINES_GEOJSON_URL=
GIS_PIPELINES_API_TOKEN=
PHASE_B_BOOTSTRAP_TOKEN=
SEED_ADMIN_EMAIL=admin@nrw-water.local
SEED_ADMIN_PASSWORD=Admin#12345
SEED_READER_EMAIL=reader@nrw-water.local
SEED_READER_PASSWORD=Reader#12345
```

If login returns `Invalid login credentials` or `Company does not match your account` during local setup:

1. Run `npm run seed:phase-b` to provision default users and profile org mapping.
2. Sign in with one of:
  - admin: `admin@nrw-water.local` / `Admin#12345`
  - meter reader: `reader@nrw-water.local` / `Reader#12345`

## Supabase setup (Phase 3 + Phase 8)

1. Create a Supabase project in the Supabase dashboard (if you do not already have one).
2. Open SQL Editor and run scripts in this order:

- `supabase/sql/phase3_auth_rbac.sql`
- `supabase/sql/phase6_schema_storage_rls.sql`
- `supabase/sql/phase7_connections_mapping.sql`
- `supabase/sql/phase8_pressure_stream.sql`

Phase 6 provisions:

- Core schema tables: `profiles`, `accounts`, `meters`, `readings`, `bills`, `pipelines`
- Private storage bucket: `meter-photos`
- Baseline RLS policies by role and ownership for tables and storage objects

## Meter Reader integration (Phase 8)

Phase 8 connects meter-reader household reading flows to Supabase:

- Account lookup reads from `accounts`
- Previous reading is derived from latest `readings.current_reading`
- Meter photo uploads to `meter-photos` storage bucket
- Household reading submission inserts into `readings` and returns persisted summary

API routes used:

- `GET /api/meter-reader/account-lookup?accountNumber=...`
- `POST /api/meter-reader/readings`

## Pressure stream integration (Phase D)

Phase D separates pressure as its own operational workflow:

- Supabase table: `pressure_readings`
  - Source point link (`connection_id`) and account link (`account_number`)
  - Pressure value + unit (`pressure_value`, `pressure_unit`)
  - Reader and validation metadata (`reader_id`, `validated_by`, `validated_at`)
  - Pressure anomaly fields (`is_anomaly`, `anomaly_reason`)
- Meter Reader pressure capture is now a dedicated flow at `/meter-reader/pressure`.
- Reports pressure widgets and anomaly actions now operate on `pressure_readings`.

Pressure API routes:

- `POST /api/meter-reader/pressure-readings`
- `PATCH /api/admin/pressure-readings/[id]/anomaly`

Ensure you have at least one account and meter row in Supabase before testing submissions.

## Phase B data bootstrap and verification

Phase B now includes idempotent seed tooling for local/dev/staging.

### CLI bootstrap

From `app/`:

```bash
npm run seed:phase-b
```

Verification:

```bash
npm run seed:phase-b:verify
```

### Admin-only bootstrap API (non-public)

- Endpoint: `POST /api/admin/bootstrap/seed`
- Access rules:
  - Must be authenticated as `admin`
  - Must include header `x-bootstrap-token` matching `PHASE_B_BOOTSTRAP_TOKEN`

### Seeded baseline dataset

- Organization context via `profiles.org_id = NRW-WATER-001`
- Auth users: 1 admin, 1 meter reader
- Pipelines: 2
- Accounts: 4 (with latitude/longitude for mapped connections baseline)
- Meters: 4
- Readings: 4
- Bills: 4

### Expected minimum row counts after seed

- `profiles >= 2`
- `pipelines >= 2`
- `accounts >= 4`
- `meters >= 4`
- `readings >= 4`
- `bills >= 4`
- mapped accounts (lat/lng present) `>= 4`

### Reset strategy

To reset only the seeded sample records, delete by seeded keys:

- Accounts: `ACC-1001` to `ACC-1004`
- Meters: `MTR-9001` to `MTR-9004`
- Pipeline names: `North Trunk`, `East Distribution`
- Billing period in seed: `2026-03-01`
- Seed user emails from `SEED_ADMIN_EMAIL` and `SEED_READER_EMAIL`

The seed is idempotent, so repeated execution updates existing rows instead of creating duplicates.

## Admin / Map / Reporting integration (Phase 9)

Phase 9 connects admin and analytics views to real Supabase data:

- Admin accounts list + details query `accounts`, `pipelines`, and `bills`
- Admin bills page reads/writes real `bills` records
- Admin user activity derives from `profiles` + latest `readings`
- Map view overlays pipeline/account markers from `pipelines`, `accounts`; pressure markers from `pressure_readings`
- Reports consumption and pressure streams are separated (`readings` vs `pressure_readings`)
- Anomaly toggles persist `is_anomaly` and `anomaly_reason`

### Optional GIS pipeline overlay

You can enrich the map with GIS attributes (pipe material and diameter) by setting:

- `GIS_PIPELINES_GEOJSON_URL`: GeoJSON FeatureCollection endpoint containing pipeline features.
- `GIS_PIPELINES_API_TOKEN`: optional bearer token for secured GIS endpoints.

### QGIS Server (WFS) configuration

If you use QGIS Server, you can configure a WFS endpoint directly instead of a prebuilt GeoJSON URL:

- `GIS_QGIS_SERVER_URL`: QGIS Server URL (for example `https://gis.example.com/qgisserver?MAP=/srv/qgis/town.qgz`)
- `GIS_QGIS_PIPELINES_TYPENAME`: WFS layer name for pipelines (for example `water:pipelines`)
- `GIS_QGIS_WFS_VERSION`: optional, defaults to `2.0.0`
- `GIS_QGIS_WFS_COUNT`: optional row limit

When `GIS_PIPELINES_GEOJSON_URL` is empty and QGIS vars are present, the app automatically calls WFS `GetFeature` with GeoJSON output.

Expected GeoJSON properties per feature (case-sensitive):

- Name: `name` or `pipeline_name`
- Material: `material` or `pipe_material`
- Diameter (mm): `diameter_mm` or `size_mm`

When GIS is configured, map pipeline details show:

- Pipe material
- Pipe size (mm)
- Geometry source (`GIS` when available, fallback `Supabase`)

Admin API routes introduced:

- `POST /api/admin/bills`
- `PATCH /api/admin/bills/[id]`
- `PATCH /api/admin/readings/[id]/anomaly`
- `POST /api/admin/accounts`
- `PATCH /api/admin/accounts/[accountNumber]`

## Connection mapping management (Phase C)

Phase C adds dedicated connection mapping entities and admin workflows:

- Supabase table: `connections`
  - Account-linked mapping (`account_number`)
  - Assigned pipeline (`pipeline_id`)
  - Validated coordinates (`latitude`, `longitude`)
  - Status (`active`, `planned`, `inactive`)
  - Audit metadata (`created_by`, `updated_by`, `created_at`, `updated_at`)
- Map page now shows mapped connection list and detail panel from live connection records.
- Admin users can add and edit mapped connections directly from the map UI.

Connection APIs:

- `GET /api/admin/connections` (admin + meter_reader read)
- `POST /api/admin/connections` (admin create)
- `PATCH /api/admin/connections/[id]` (admin update)

## Run locally (Phase 13)

1. Install dependencies:

```bash
npm install
```

2. Ensure `.env.local` is set from `.env.local.example`.
3. Ensure Supabase SQL scripts were applied (see **Supabase setup** section).
4. Start development server:

```bash
npm run dev
```

5. Open `http://localhost:3000` and sign in.

If Windows PowerShell blocks npm scripts, use `npm.cmd` instead of `npm`.

## Quality and test commands

```bash
npm run check            # lint + typecheck + prettier check + unit tests
npm run build            # production build
npm run test             # unit tests (Vitest)
npm run test:e2e         # full Playwright E2E
npm run test:e2e:smoke   # smoke tests (local or deployed URL)
```

## Deployment (Phase 12)

### 1) Connect repository to Vercel

1. In Vercel dashboard, import `NRW.Web` from GitHub.
2. Set **Root Directory** to `app`.
3. Keep framework preset as **Next.js**.

### 2) Configure environment variables per environment

In Vercel project settings, set these variables for **Preview** and **Production**:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Use a separate Supabase project for Preview if available.

### 3) Enable preview deployments for pull requests

Workflow file: `.github/workflows/vercel-deploy.yml`

- Pull requests to `main` trigger preview deployments.
- Workflow posts/updates preview URL on the PR thread.

Required GitHub configuration:

- Repository secret: `VERCEL_TOKEN`
- Repository variable: `VERCEL_ORG_ID`
- Repository variable: `VERCEL_PROJECT_ID`

### 4) Validate production core flows

Production deploy runs from push to `main` (or manual dispatch) and includes smoke validation:

- Deploy to Vercel production
- Run `npm run test:e2e:smoke` against deployed URL

Local deployment helpers:

```bash
npm run deploy:preview
npm run deploy:production
```

## Documentation + handover (Phase 13)

- Developer notes (structure and conventions): `docs/DEVELOPER_NOTES.md`
- Admin dashboard/reports usage guide: `docs/ADMIN_USAGE_GUIDE.md`

## Notes on roles

- Role is derived from Supabase `app_metadata.role` when creating a missing profile.
- If no role is present in metadata, fallback role is `meter_reader`.
- For admin users, ensure `app_metadata.role = "admin"` or create/update their profile row accordingly.
- Company access is enforced against `profiles.org_id` and selected company context.
