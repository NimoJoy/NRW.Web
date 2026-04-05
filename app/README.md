# NRW Water Billing App

NRW Water Billing App is a Next.js and Supabase application for water utility operations. It supports two operational roles:

- `admin`
- `meter_reader`

The system combines customer account administration, billing, route-protected operational dashboards, meter reading submission, pressure capture, reporting, and pipeline mapping in a single web application.

## What the project does

This application is designed for day-to-day utility workflows.

### Admin workflows

- Sign in through a company-first login flow.
- View an authenticated dashboard shell.
- Manage customer accounts with create and edit flows.
- Review billing records and update bill status.
- Monitor meter reader activity.
- View live reports backed by Supabase data.
- Review and manage anomaly flags.
- Manage mapped connections on the map view.

### Meter reader workflows

- Select company context before authentication.
- Search for an account and inspect previous reading details.
- Submit a household meter reading with validation and photo upload.
- Submit pressure readings through a separate workflow.
- Correct their own submitted readings within a 24-hour window.

### Shared operational features

- Role-based route protection.
- Company-context enforcement using a cookie-bound tenant selection.
- Supabase-backed data access for accounts, readings, bills, connections, pipelines, and pressure data.
- Audit logging for editable operational actions.
- GIS/QGIS integration for enriched pipeline overlays.

## How the project works

### Authentication and session flow

1. A user opens `/login`.
2. The login form first asks the user to select a water company.
3. The user then signs in with Supabase email/password authentication.
4. The selected company is persisted in the `nrw_company` cookie.
5. Server-side session helpers validate both authentication and company context.
6. The app redirects the user to the correct role home route:
   - `admin` -> `/dashboard`
   - `meter_reader` -> `/meter-reader/search`

### Authorization model

- Role checks for pages and layouts are handled in server-side auth helpers.
- API route access is protected separately from page rendering.
- Company context must match `profiles.org_id` before a user can access authenticated areas.
- Missing or invalid company context redirects back to login with an explanatory reason.

### Data flow

- Browser-side interactive forms use the Supabase browser client where appropriate.
- Server components fetch live data for reports, map overlays, accounts, bills, and activity feeds.
- Protected API routes perform writes for readings, pressure submissions, bills, accounts, anomalies, connection updates, and seeding.
- Service-role access is restricted to trusted server-side paths.

### Rendering model

- The project uses the Next.js App Router.
- Server components are the default.
- Client components are used only where stateful interactions are required.
- Route groups separate authenticated app routes from auth routes.

## Current application modules

### Authentication

- Company-first login flow.
- Supabase session handling.
- Role-aware home redirects.

### Admin surface

- `Dashboard`: high-level shell and status cards.
- `Admin Accounts`: create, edit, search, filter, pagination, and account details.
- `Admin Bills`: create and update bill records.
- `Admin Users`: meter reader activity monitoring.
- `Reports`: live metrics, trends, filters, and anomaly actions.
- `Map`: pipeline, account, pressure, and connection visualization.

### Meter reader surface

- `Search`: account lookup and prior reading context.
- `Submit`: household meter reading submission with photo upload.
- `Pressure`: pressure capture separate from consumption entry.

## Tech stack

### Application stack

- Next.js `16.1.6`
- React `19.2.3`
- TypeScript `5`
- Tailwind CSS `4`
- Supabase Auth, database, storage, and SSR helpers

### Data and backend services

- Supabase Postgres for operational data
- Supabase Auth for email/password authentication
- Supabase Storage for meter-photo uploads
- Row-level security policies for role-aware access

### Testing and quality

- Vitest for unit and component tests
- Testing Library for React component behavior
- Playwright for end-to-end verification
- ESLint for linting
- Prettier for formatting checks

### Hosting and delivery

- Vercel for hosting and runtime environments
- GitHub Actions for CI and controlled deployment automation

## Third-party dependencies

This section covers the external packages and services used by the project.

### Runtime dependencies

- `@supabase/ssr` `^0.9.0`: Supabase SSR integration for cookie-aware clients.
- `@supabase/supabase-js` `^2.99.2`: Supabase client SDK for auth, database, and storage access.
- `next` `16.1.6`: application framework.
- `next-themes` `^0.4.6`: theme handling.
- `react` `19.2.3`: UI library.
- `react-dom` `19.2.3`: DOM renderer for React.

### Development and test dependencies

- `@playwright/test` `^1.58.2`: E2E test runner.
- `@tailwindcss/postcss` `^4`: Tailwind PostCSS integration.
- `@testing-library/jest-dom` `^6.9.1`: DOM assertions for tests.
- `@testing-library/react` `^16.3.2`: React component test utilities.
- `@types/node` `^20`: Node.js TypeScript types.
- `@types/react` `^19`: React TypeScript types.
- `@types/react-dom` `^19`: React DOM TypeScript types.
- `eslint` `^9`: linting engine.
- `eslint-config-next` `16.1.6`: Next.js ESLint rules.
- `jsdom` `^29.0.0`: DOM environment for component tests.
- `prettier` `^3.8.1`: formatting and formatting checks.
- `tailwindcss` `^4`: utility-first CSS framework.
- `typescript` `^5`: static typing.
- `vitest` `^4.1.0`: unit and component test runner.

### Platform and service dependencies

- Supabase: authentication, database, storage, and RLS enforcement.
- Vercel: deployment target, environment management, and hosting.
- GitHub Actions: CI, preview deployment orchestration, and production deployment orchestration.
- Vercel CLI: used by local deployment scripts and GitHub Actions deployment workflows.

### GitHub Actions marketplace actions used

- `actions/checkout@v4`
- `actions/setup-node@v4`
- `actions/github-script@v7`
- `actions/upload-artifact@v4`

## Project structure

```text
app/
  app/
    (auth)/
    (app)/
    api/
  components/
  docs/
  e2e/
  lib/
  public/
  scripts/
  supabase/sql/
  test/
```

### Key directories

- `app/app/(auth)`: authentication routes.
- `app/app/(app)`: authenticated application routes.
- `app/app/api`: internal API handlers.
- `app/components`: feature and shared UI components.
- `app/lib/auth`: session, company-context, and access-control helpers.
- `app/lib/supabase`: browser, server, admin, and env helpers.
- `app/lib/phase9`: data mapping, types, and formatting helpers for live features.
- `app/scripts`: bootstrap and verification scripts.
- `app/supabase/sql`: SQL setup scripts for schema, RLS, storage, connections, pressure, and audit logging.
- `.github/workflows`: CI and deployment workflows.

## Prerequisites

- Node.js `20+`
- A Supabase project
- A Vercel account for hosted deployment
- A GitHub repository if you want CI/CD and automated deployments

## Environment variables

Copy `.env.local.example` to `.env.local` for local development.

### Required for local development and hosted environments

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### Optional GIS integration

- `GIS_PIPELINES_GEOJSON_URL`
- `GIS_PIPELINES_API_TOKEN`
- `GIS_QGIS_SERVER_URL`
- `GIS_QGIS_PIPELINES_TYPENAME`
- `GIS_QGIS_WFS_VERSION`
- `GIS_QGIS_WFS_COUNT`

### Optional bootstrap and seeded-user configuration

- `PHASE_B_BOOTSTRAP_TOKEN`
- `SEED_ADMIN_EMAIL`
- `SEED_ADMIN_PASSWORD`
- `SEED_ADMIN2_EMAIL`
- `SEED_ADMIN2_PASSWORD`
- `SEED_READER_EMAIL`
- `SEED_READER_PASSWORD`
- `SEED_READER2_EMAIL`
- `SEED_READER2_PASSWORD`

### Environment variable guidance

- `NEXT_PUBLIC_*` variables are compiled into the client bundle and must exist in Vercel for the target environment before deployment.
- Vercel does not read your local `.env.local` file.
- `SUPABASE_SERVICE_ROLE_KEY` must never be exposed as a `NEXT_PUBLIC_*` variable.
- If you deploy preview builds, set the required Supabase variables for `Preview` as well as `Production`.

## How to replicate the project locally

### 1. Clone and install

From the repository root:

```bash
cd app
npm install
```

If Windows PowerShell blocks npm scripts on your machine, use `npm.cmd` instead of `npm`.

### 2. Create local environment file

Copy the example file and populate it with real values:

```bash
copy .env.local.example .env.local
```

Set at least:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

### 3. Create and configure Supabase

In the Supabase dashboard:

1. Create a project.
2. Open `Project Settings > API`.
3. Copy:
   - Project URL -> `NEXT_PUBLIC_SUPABASE_URL`
   - anon public key -> `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role secret key -> `SUPABASE_SERVICE_ROLE_KEY`

### 4. Apply the SQL setup scripts

Run these scripts in the Supabase SQL Editor in this order:

1. `supabase/sql/phase3_auth_rbac.sql`
2. `supabase/sql/phase6_schema_storage_rls.sql`
3. `supabase/sql/phase7_connections_mapping.sql`
4. `supabase/sql/phase8_pressure_stream.sql`
5. `supabase/sql/phase9_editable_dashboards_audit.sql`

These scripts provision the core schema, storage bucket, RLS policies, connection mapping support, pressure workflow support, and audit logging.

### 5. Seed sample data

From `app/`:

```bash
npm run seed:phase-b
```

To verify the seed output:

```bash
npm run seed:phase-b:verify
```

Default seeded credentials are:

- Admin: `admin@nrw-water.local` / `Admin#12345`
- Admin 2: `admin2@nrw-water.local` / `Admin#12345`
- Meter reader: `reader@nrw-water.local` / `Reader#12345`
- Meter reader 2: `reader2@nrw-water.local` / `Reader#12345`

### 6. Start the app

```bash
npm run dev
```

Open `http://localhost:3000`.

### 7. Test the main flows

1. Select the company `NRW-WATER-001` on the login screen.
2. Sign in with one of the seeded users.
3. Verify the redirect lands on the correct role home page.
4. Exercise account search, reading submission, reports, and map views.

## Quality commands

From `app/`:

```bash
npm run lint
npm run typecheck
npm run format:check
npm run test
npm run test:e2e
npm run test:e2e:smoke
npm run build
npm run check
```

### Script reference

- `npm run dev`: run the development server.
- `npm run build`: create a production build.
- `npm run start`: run the production server locally.
- `npm run seed:phase-b`: create or update baseline demo data.
- `npm run seed:phase-b:verify`: verify seeded dataset health.
- `npm run lint`: run ESLint.
- `npm run typecheck`: run TypeScript checks.
- `npm run format`: format the repository.
- `npm run format:check`: verify formatting.
- `npm run test`: run unit and component tests.
- `npm run test:watch`: run Vitest in watch mode.
- `npm run test:e2e`: run Playwright E2E tests.
- `npm run test:e2e:smoke`: run smoke-tagged Playwright tests.
- `npm run check`: run lint, typecheck, formatting, and unit tests together.
- `npm run deploy:preview`: local preview deployment through Vercel CLI.
- `npm run deploy:production`: local production deployment through Vercel CLI.

## Deployment with Vercel

Vercel is the hosting platform for this app. It provides the runtime environment, build output hosting, and environment-variable management.

### Required Vercel project setup

1. Import the repository into Vercel.
2. Set the project Root Directory to `app`.
3. Keep the framework preset as Next.js.
4. Add environment variables in `Project Settings > Environment Variables`.

### Required Vercel environment variables

Set these for both `Preview` and `Production` unless you intentionally use different environment layouts:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Add optional GIS and bootstrap variables only if you use those features.

### Important Vercel behavior

- Vercel does not use your local `.env.local` file.
- `NEXT_PUBLIC_*` values are injected at build time.
- If you add or change env vars, you must redeploy.
- Preview and Production env scopes are separate.

## How GitHub Actions fit into deployment

This repository uses GitHub Actions for both quality gates and Vercel deployment orchestration.

### CI workflow

Workflow file: `.github/workflows/ci.yml`

Triggers:

- All pull requests
- Pushes to `main`

What it does:

1. Installs dependencies in `app/`.
2. Runs linting.
3. Runs TypeScript checks.
4. Runs Prettier format checks.
5. Runs unit and component tests.
6. Builds the app.
7. Runs Playwright E2E tests.
8. Uploads the Playwright report artifact.

This workflow acts as the quality baseline before deployment.

### Vercel deployment workflow

Workflow file: `.github/workflows/vercel-deploy.yml`

Triggers:

- Pull requests to `main`
- Pushes to `main`
- Manual `workflow_dispatch`

What it does:

#### Preview deployments

- Triggered for same-repository pull requests targeting `main`.
- Pulls Vercel preview environment configuration.
- Builds with the Vercel CLI.
- Deploys a preview build.
- Posts or updates the preview URL in the pull request comments.

#### Production deployments

- Triggered on pushes to `main` or manual dispatch.
- Pulls Vercel production environment configuration.
- Builds with the Vercel CLI.
- Deploys the production build.
- Installs Playwright browsers.
- Runs smoke E2E tests against the deployed URL.

### Required GitHub repository configuration

The deployment workflow expects these values in GitHub:

- Repository secret: `VERCEL_TOKEN`
- Repository variable: `VERCEL_ORG_ID`
- Repository variable: `VERCEL_PROJECT_ID`

### Why both Vercel and GitHub Actions are used

- Vercel provides the hosted environment and runtime configuration.
- GitHub Actions provides repeatable automation for validation and deployment.
- The workflow uses Vercel CLI so deployment is versioned and enforced from the repository.
- Production smoke tests run immediately after deployment, which gives an additional safeguard beyond build success.

## Operational notes

### Roles

- `admin` users land on `/dashboard`.
- `meter_reader` users land on `/meter-reader/search`.
- If no valid role exists in metadata, the fallback role is `meter_reader`.

### Company context

- Supported company selection is currently anchored to `NRW-WATER-001`.
- Access requires the company cookie to match `profiles.org_id`.

### Audit logging

Editable flows write to `audit_logs` once the audit SQL script is applied.

### Pressure workflow separation

- Household consumption is stored in `readings`.
- Pressure capture is stored in `pressure_readings`.
- The app deliberately keeps these as separate operational workflows.

## Additional documentation

- `docs/DEVELOPER_NOTES.md`: structure, conventions, and contributor guidance.
- `docs/ADMIN_USAGE_GUIDE.md`: operational admin guidance for reports and anomaly actions.
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

Vercel does not use your local `.env.local`. Add the variables in **Project Settings > Environment Variables** and redeploy after saving them.

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
