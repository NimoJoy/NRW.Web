# Developer Notes

This document summarizes project structure and conventions for contributors.

## 1) Project structure

- `app/` (Next.js application root)
  - `app/app/`
    - `(auth)/` login route group
    - `(app)/` authenticated app route group (admin + meter reader)
    - `api/` internal API routes
  - `components/`
    - `ui/` shared primitives (`Card`, `Table`, `PageHeader`, `StatusBadge`, etc.)
    - feature folders (`admin`, `meter-reader`, `reports`, `map`, `auth`)
  - `lib/`
    - `auth/` session + role guard helpers
    - `supabase/` browser/server/admin Supabase clients and env helpers
    - `phase9/` data mappers, formatting, and shared feature types
    - `mock-data/` placeholder data used where backend wiring is intentionally deferred
  - `supabase/sql/` SQL scripts for schema, RLS, and storage setup
  - `e2e/` Playwright tests
  - `test/` unit test setup
- `.github/workflows/`
  - `ci.yml` quality + E2E checks
  - `vercel-deploy.yml` preview and production deployment flow

## 2) Conventions

### Routing and rendering

- Use server components by default.
- Add `"use client"` only for interactive stateful UI.
- Use route-group layouts for RBAC boundaries (for example admin-only sections).

### Auth and role enforcement

- Page/layout role checks use `requireRole(...)` from `lib/auth/session.ts`.
- Authenticated app layout uses `requireUserSession()` and `AppShell`.
- API handlers enforce permissions via `requireApiRoles(...)` from `lib/auth/api-guards.ts`.
- Company-first login uses two steps in `components/auth/login-form.tsx`:
  1. company selection
  2. credentials auth + company context bind via `POST /api/auth/company-context`
- Session and API guards require company cookie context (`nrw_company`) to match `profiles.org_id`.

### Editable dashboard boundaries (Phase F)

- Admin account edit APIs:
  - `POST /api/admin/accounts`
  - `PATCH /api/admin/accounts/[accountNumber]`
- Meter reader correction API:
  - `PATCH /api/meter-reader/readings/[id]/correction`
  - meter readers can only correct own readings within 24 hours
- Account edits, bill status edits, connection edits, and reading corrections are audit-logged.
- Apply `supabase/sql/phase9_editable_dashboards_audit.sql` for `audit_logs` schema/policies.

### Quality/UAT boundaries (Phase G)

- Keep auth, map connection, pressure, and correction regressions covered by colocated component tests.
- Keep route-protection and login-sequencing checks in Playwright `e2e/auth-flow.spec.ts`.
- Maintain release controls in:
  - `workplan/PHASE_G_UAT_SCRIPTS.md`
  - `workplan/PHASE_G_RELEASE_CHECKLIST.md`

### Supabase access

- Browser client: `lib/supabase/client.ts`.
- Server client (cookies/session-aware): `lib/supabase/server.ts`.
- Admin client (service role): `lib/supabase/admin.ts`.
- Keep service-role usage on trusted server paths only.

### Data and typing

- Feature-level data mapping lives in `lib/phase9/data.ts`.
- Shared feature types live in `lib/phase9/types.ts`.
- Shared formatting helpers live in `lib/phase9/format.ts`.
- Prefer explicit transformation from DB rows to UI models.
- Keep pressure as a dedicated stream:
  - Household consumption in `readings`
  - Pressure capture and anomalies in `pressure_readings`

### Pressure workflow boundaries

- Household reading submission route: `POST /api/meter-reader/readings`
- Dedicated pressure capture route: `POST /api/meter-reader/pressure-readings`
- Pressure anomaly admin route: `PATCH /api/admin/pressure-readings/[id]/anomaly`
- Avoid re-coupling pressure fields back into household reading forms.

### UI patterns

- Reuse primitives in `components/ui` before introducing new custom wrappers.
- Keep forms and local interaction logic in feature client components.
- Keep route pages thin by delegating complex UI to components.

## 3) Developer workflow

From `app/`:

```bash
npm install
npm run dev
```

Pre-PR quality baseline:

```bash
npm run check
npm run build
npm run test:e2e
```

Phase B data bootstrap:

```bash
npm run seed:phase-b
npm run seed:phase-b:verify
```

Admin-only bootstrap route (non-public):

- `POST /api/admin/bootstrap/seed`
- Requires admin auth session and `x-bootstrap-token` header matching `PHASE_B_BOOTSTRAP_TOKEN`.

Smoke test only:

```bash
npm run test:e2e:smoke
```

## 4) Testing conventions

- Unit/component tests use Vitest + Testing Library and are colocated as `*.test.tsx`.
- E2E tests use Playwright under `e2e/`.
- Production validation uses smoke-tagged tests (`@smoke`).
- Phase G scenario coverage includes tags for deeper auth/edit-route checks (`@phaseg`).

## 5) Deployment conventions

- Preview deploys run on PRs to `main`.
- Production deploy runs on `main` pushes or manual dispatch.
- Required GitHub configuration:
  - secret: `VERCEL_TOKEN`
  - vars: `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
