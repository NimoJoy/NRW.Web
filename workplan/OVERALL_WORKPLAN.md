# NRW Water Billing — Overall Workplan# NRW Water Billing — Overall Workplan

















































































































































































































































If you want, I can now scaffold the Next.js app, create the initial commit, and wire basic Supabase client code. Tell me which choices to lock in (Tailwind? Mapbox or Leaflet?), and I will continue.---```- Deploy: push to GitHub and connect to Vercel.- Supabase CLI (optional): `npm i -g supabase` then `supabase login` and `supabase init````npm install @supabase/supabase-js tailwindcss chart.js react-chartjs-2 leaflet react-leafletcd app```bash- Install libs:```npx create-next-app@latest app --typescript```bash- Scaffold Next.js:## Useful Commands Summary---3. Create Supabase project and share `NEXT_PUBLIC_SUPABASE_URL` and anon key in `.env.local` (do not commit keys).2. I'll scaffold the Next.js app and push initial commit (if you want).1. Confirm tech choices (Tailwind vs other, Mapbox vs Leaflet, Chart library).## Next Steps (immediate recommendations)---- Week 5: Testing, CI, and deployment.- Week 4: Map integration, charts, anomaly flags.- Week 3: Photo upload, account search, admin list views.- Week 2: Auth + RBAC, basic meter reader flow.- Week 1: Setup, Next.js scaffold, Supabase schema design.## Suggested Milestone Schedule (example)---- Admin guide: how to use dashboard and interpret analytics.- Developer guide: folder structure and how to run locally.- Setup guide (`README.md`) with `npm` commands, env var list, and Supabase setup steps.Include:## Phase 12 — Documentation & Handover---Acceptance criteria: app deployed, login works, and readings persist to Supabase.4. Setup preview deployments for PRs.3. Configure environment variables in Vercel (use `NEXT_PUBLIC_` for client keys only).2. Connect repository to Vercel.1. Push repo to GitHub.Steps:## Phase 11 — Deployment to Vercel---Acceptance criteria: tests run on CI and main branch protected by passing checks.- Optional GitHub Actions for tests and lint on PRs.- Add tests: Jest/React Testing Library for components, and Playwright for E2E.- Add ESLint, Prettier, and TypeScript strictness rules.Tasks:## Phase 10 — Testing, Linting & CI/CD---- Store only necessary EXIF or strip sensitive metadata before upload.- Ensure privacy rules and retention policy.- Use Supabase Storage with expiry URLs for private access.## Phase 9 — Photo Storage & Privacy---Acceptance criteria: charts render data and anomalies are flagged and viewable.4. Advanced: scheduled serverless function to analyze trends and flag anomalies.   - Mark anomalies in `readings` table with `is_anomaly` boolean and `anomaly_reason`.   - Flag readings where pressure < X or > Y (configurable thresholds).3. Implement anomaly detection (simple rules first):2. Add filters (date range, pipeline, account).1. Build charts showing pressure/time per sensor or account (Chart.js/Recharts).Steps:Goal: Charts for pressure readings and anomaly detection.## Phase 8 — Reporting & Analytics---Acceptance criteria: pipelines and account markers are visible and clickable.4. Allow admin to click marker for last reading details.3. Render map tiles and overlay pipeline polylines and account markers.2. Store pipeline geo data in `pipelines` (GeoJSON or coordinate arrays).1. Choose mapping provider: Leaflet + OpenStreetMap or Mapbox (requires key).Steps:Goal: Show pipelines and optionally reading locations on a map.## Phase 7 — Map Page (Pipelines)---Acceptance criteria: Admin can view accounts & readings and see uploaded photos.- Paginate results and index `accounts.account_number`.- Use server components to fetch lists and protect endpoints.Implementation notes:- Users management: view meter readers and their recent activity.- Bills management: view, create, mark paid.- Accounts list with search/filter and per-account details (including readings and bills).Pages:Goal: Admins can view accounts, bills, and readings.## Phase 6 — Admin Dashboard---Acceptance criteria: a full reading can be submitted, photo stored, and reading visible in admin UI.6. Offline considerations (optional): queue readings locally and sync.5. On submit: validate reading, compute `consumption`, upload photo to Supabase Storage, insert `readings` row.4. Photo capture: implement file input using `accept="image/*"` and `capture="environment"` for mobile.3. Present `ReadingForm` with previous reading prefilled and `current_reading` input.2. Query `accounts` and latest `readings` for previous reading.1. Search/Create page where reader enters `Account number`.Steps:Goal: Meter readers can search accounts, fetch previous reading, take photo, and submit reading.## Phase 5 — Meter Reader Features (Core Field Flow)---Acceptance criteria: components are reusable and tested in storybook or local pages.- Add client and server-side helpers for uploads (signed URLs if needed).- Create Supabase helpers: `getAccountByNumber(accountNumber)`, `getPreviousReading(accountNumber)`, `submitReading(payload)`.- Create `AccountCard`, `ReadingForm`, `PhotoUploader`, `MapView`, `Chart` components.Tasks:Goal: Build reusable UI pieces and data fetching utilities.## Phase 4 — Common Components & Utilities---Acceptance criteria: Admin and Meter Reader can log in and see only their allowed pages.4. Setup helper `supabaseServerClient()` for server actions.3. Protect Next.js app routes: server-side check session and role. Use middleware or server components.2. On first login, populate `profiles` table with role and metadata.1. Use Supabase Auth for sign-in (magic link or email/password). Implement login UI.Steps:Goal: Implement login for Admin and Meter Reader and protect routes.## Phase 3 — Authentication & RBAC---Acceptance criteria: tables exist and basic RLS policies prevent unauthorized access.4. Add Row Level Security (RLS) policies: restrict reads/writes by role and user id.3. Configure Storage bucket `meter-photos` with public/private rules.2. Create tables using SQL editor or migrations.1. Create Supabase project at https://app.supabase.comSteps:- `pipelines` (id, name, geojson or coordinates)- `bills` (id, account_number, billing_period, amount_due, status)- `readings` (id, meter_id FK, account_number, previous_reading, current_reading, consumption, pressure, photo_path, reader_id, recorded_at)- `meters` (meter_id, account_number FK, meter_number, install_date)- `accounts` (account_number PK, customer_name, address, location {lat,lng}, pipeline_id)- `profiles` (id, user_id, role: 'admin' | 'meter_reader', name, phone, org_id)- `users` (managed by Supabase Auth)Recommended schema (minimum):Goal: Create Supabase project and design DB tables.## Phase 2 — Supabase Setup & DB Schema---Acceptance criteria: app runs on `http://localhost:3000` and layout loads.- `SUPABASE_SERVICE_ROLE_KEY` (only for server-side use, keep secret)- `NEXT_PUBLIC_SUPABASE_ANON_KEY`- `NEXT_PUBLIC_SUPABASE_URL`5. Add environment variables in `.env.local` (do not commit):4. Create project layout: `app/layout.tsx`, `app/(auth)/` and `app/(app)/` route groups.3. Initialize Tailwind: `npx tailwindcss init -p` and configure.```npm install chart.js react-chartjs-2 leaflet react-leafletnpm install @supabase/supabase-js tailwindcss postcss autoprefixercd app```bash2. Install dependencies: Supabase client, Tailwind, map/chart libs.```pnpm create next-app@latest app -- --ts# ornpx create-next-app@latest app --typescript```bash1. Scaffold Next app:Steps:Goal: Create Next.js TypeScript app with Tailwind and base layout.## Phase 1 — Scaffold Next.js App---Acceptance criteria: remote repo exists and initial commit pushed.```git push -u origin maingit remote add origin <your-github-remote-url># create remote repo on GitHub, then:git branch -M maingit commit -m "chore: initial workplan and repo"git add .git init```bashGit commands:- Decide branching model: `main` (stable), `develop` (integration), feature branches `feat/*`.- Add `.gitignore`, `README.md`, and this `workplan/OVERALL_WORKPLAN.md`.- Create Git repo locally and remote on GitHub.Steps:Goal: Create repo skeleton, basic README, and workplan files.## Phase 0 — Setup (Immediate)---Each phase contains step-by-step tasks and acceptance criteria below.10. Deployment to Vercel & final polish9. Testing, linting, and CI/CD8. Reporting & analytics + anomaly detection7. Map page (pipelines visualization)6. Admin features (dashboard, accounts, bills)5. Meter Reader flows (core field features)4. Scaffold UI and common layout3. Authentication & RBAC2. Supabase project, DB schema, and storage1. Project setup & Git## High-level Phases (ordered)---- Deployment: Vercel- Charts: Chart.js / Recharts / Supabase + D3 for advanced- Maps: Leaflet or Mapbox GL JS- Backend/Auth/DB: Supabase (Postgres, Auth, Storage)- Styling: Tailwind CSS (or your preferred UI library)- Frontend: Next.js (App Router) + TypeScriptTech stack (recommended):- Admin dashboard (accounts and bills), map of pipelines, reporting & analytics with anomaly flags.- Meter reading entry flow (previous reading lookup, current reading input, photo upload).- Authentication for Admin and Meter Reader roles (via Supabase Auth).Non-negotiable features:- Meter Reader: field app to record meter readings, take meter photos, and search accounts.- Organization Admin: dashboard, map, reporting, account management.A Next.js + Supabase web application for a water billing company with two user roles:## Project Overview
## Project Overview
A Next.js + Supabase web application for a water billing company with two user roles:
- Organization Admin: dashboard, map, reporting, account management.
- Meter Reader: field app to record meter readings, take meter photos, and search accounts.

Non-negotiable features:
- Authentication for Admin and Meter Reader roles (via Supabase Auth).
- Meter reading entry flow (previous reading lookup, current reading input, photo upload).
- Admin dashboard (accounts and bills), map of pipelines, reporting & analytics with anomaly flags.

Tech stack (recommended):
- Frontend: Next.js (App Router) + TypeScript
- Styling: Tailwind CSS (or your preferred UI library)
- Backend/Auth/DB: Supabase (Postgres, Auth, Storage)
- Maps: Leaflet or Mapbox GL JS
- Charts: Chart.js / Recharts / Supabase + D3 for advanced
- Deployment: Vercel

---

## High-level Phases (ordered)
1. Project setup & Git
2. Supabase project, DB schema, and storage
3. Authentication & RBAC
4. Scaffold UI and common layout
5. Meter Reader flows (core field features)
6. Admin features (dashboard, accounts, bills)
7. Map page (pipelines visualization)
8. Reporting & analytics + anomaly detection
9. Testing, linting, and CI/CD
10. Deployment to Vercel & final polish

Each phase contains step-by-step tasks and acceptance criteria below.

---

## Phase 0 — Setup (Immediate)
Goal: Ensure the cloned repository is ready for development and contains the workplan.
Context: The project has already been cloned into this folder; we will confirm remote/origin, branch model, and essential files.
Steps:
- Verify the Git remote and set `origin` if missing.
- Ensure branch strategy: confirm or create `main` and `develop` branches.
- Ensure essential files exist: `.gitignore`, `README.md`, and `workplan/OVERALL_WORKPLAN.md` (already added).
- Make an initial or follow-up commit for any missing scaffolding and push to remote.
Git commands (use as appropriate):
```bash
# Check remotes
git remote -v
# If no origin: add remote
git remote add origin <your-github-remote-url>
# Ensure correct default branch
git branch -M main
# Create develop branch (optional)
git checkout -b develop
# Stage and commit any local changes
git add .
git commit -m "chore: repo setup — workplan and initial files"
git push -u origin main
git push -u origin develop
```
Notes:
- If the repo already has an upstream remote and branches, simply ensure your local branches track the intended remotes and pull the latest changes.
- Configure branch protection and required checks on GitHub after pushing (optional).
Acceptance criteria: repository remote is configured, `main` (and `develop` if desired) exist and are pushed, and `workplan/OVERALL_WORKPLAN.md` is present in the repo.

---

## Phase 1 — Scaffold Next.js App
Goal: Create Next.js TypeScript app with Tailwind and base layout.
Steps:
1. Scaffold Next app:
```bash
npx create-next-app@latest app --typescript
# or
pnpm create next-app@latest app -- --ts
```
2. Install dependencies: Supabase client, Tailwind, map/chart libs.
```bash
cd app
npm install @supabase/supabase-js tailwindcss postcss autoprefixer
npm install chart.js react-chartjs-2 leaflet react-leaflet
```
3. Initialize Tailwind: `npx tailwindcss init -p` and configure.
4. Create project layout: `app/layout.tsx`, `app/(auth)/` and `app/(app)/` route groups.
5. Add environment variables in `.env.local` (do not commit):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (only for server-side use, keep secret)
Acceptance criteria: app runs on `http://localhost:3000` and layout loads.

---

## Phase 2 — Supabase Setup & DB Schema
Goal: Create Supabase project and design DB tables.
Recommended schema (minimum):
- `users` (managed by Supabase Auth)
- `profiles` (id, user_id, role: 'admin' | 'meter_reader', name, phone, org_id)
- `accounts` (account_number PK, customer_name, address, location {lat,lng}, pipeline_id)
- `meters` (meter_id, account_number FK, meter_number, install_date)
- `readings` (id, meter_id FK, account_number, previous_reading, current_reading, consumption, pressure, photo_path, reader_id, recorded_at)
- `bills` (id, account_number, billing_period, amount_due, status)
- `pipelines` (id, name, geojson or coordinates)

Steps:
1. Create Supabase project at https://app.supabase.com
2. Create tables using SQL editor or migrations.
3. Configure Storage bucket `meter-photos` with public/private rules.
4. Add Row Level Security (RLS) policies: restrict reads/writes by role and user id.
Acceptance criteria: tables exist and basic RLS policies prevent unauthorized access.

---

## Phase 3 — Authentication & RBAC
Goal: Implement login for Admin and Meter Reader and protect routes.
Steps:
1. Use Supabase Auth for sign-in (magic link or email/password). Implement login UI.
2. On first login, populate `profiles` table with role and metadata.
3. Protect Next.js app routes: server-side check session and role. Use middleware or server components.
4. Setup helper `supabaseServerClient()` for server actions.
Acceptance criteria: Admin and Meter Reader can log in and see only their allowed pages.

---

## Phase 4 — Common Components & Utilities
Goal: Build reusable UI pieces and data fetching utilities.
Tasks:
- Create `AccountCard`, `ReadingForm`, `PhotoUploader`, `MapView`, `Chart` components.
- Create Supabase helpers: `getAccountByNumber(accountNumber)`, `getPreviousReading(accountNumber)`, `submitReading(payload)`.
- Add client and server-side helpers for uploads (signed URLs if needed).
Acceptance criteria: components are reusable and tested in storybook or local pages.

---

## Phase 5 — Meter Reader Features (Core Field Flow)
Goal: Meter readers can search accounts, fetch previous reading, take photo, and submit reading.
Steps:
1. Search/Create page where reader enters `Account number`.
2. Query `accounts` and latest `readings` for previous reading.
3. Present `ReadingForm` with previous reading prefilled and `current_reading` input.
4. Photo capture: implement file input using `accept="image/*"` and `capture="environment"` for mobile.
5. On submit: validate reading, compute `consumption`, upload photo to Supabase Storage, insert `readings` row.
6. Offline considerations (optional): queue readings locally and sync.
Acceptance criteria: a full reading can be submitted, photo stored, and reading visible in admin UI.

---

## Phase 6 — Admin Dashboard
Goal: Admins can view accounts, bills, and readings.
Pages:
- Accounts list with search/filter and per-account details (including readings and bills).
- Bills management: view, create, mark paid.
- Users management: view meter readers and their recent activity.
Implementation notes:
- Use server components to fetch lists and protect endpoints.
- Paginate results and index `accounts.account_number`.
Acceptance criteria: Admin can view accounts & readings and see uploaded photos.

---

## Phase 7 — Map Page (Pipelines)
Goal: Show pipelines and optionally reading locations on a map.
Steps:
1. Choose mapping provider: Leaflet + OpenStreetMap or Mapbox (requires key).
2. Store pipeline geo data in `pipelines` (GeoJSON or coordinate arrays).
3. Render map tiles and overlay pipeline polylines and account markers.
4. Allow admin to click marker for last reading details.
Acceptance criteria: pipelines and account markers are visible and clickable.

---

## Phase 8 — Reporting & Analytics
Goal: Charts for pressure readings and anomaly detection.
Steps:
1. Build charts showing pressure/time per sensor or account (Chart.js/Recharts).
2. Add filters (date range, pipeline, account).
3. Implement anomaly detection (simple rules first):
   - Flag readings where pressure < X or > Y (configurable thresholds).
   - Mark anomalies in `readings` table with `is_anomaly` boolean and `anomaly_reason`.
4. Advanced: scheduled serverless function to analyze trends and flag anomalies.
Acceptance criteria: charts render data and anomalies are flagged and viewable.

---

## Phase 9 — Photo Storage & Privacy
- Use Supabase Storage with expiry URLs for private access.
- Ensure privacy rules and retention policy.
- Store only necessary EXIF or strip sensitive metadata before upload.

---

## Phase 10 — Testing, Linting & CI/CD
Tasks:
- Add ESLint, Prettier, and TypeScript strictness rules.
- Add tests: Jest/React Testing Library for components, and Playwright for E2E.
- Optional GitHub Actions for tests and lint on PRs.
Acceptance criteria: tests run on CI and main branch protected by passing checks.

---

## Phase 11 — Deployment to Vercel
Steps:
1. Push repo to GitHub.
2. Connect repository to Vercel.
3. Configure environment variables in Vercel (use `NEXT_PUBLIC_` for client keys only).
4. Setup preview deployments for PRs.
Acceptance criteria: app deployed, login works, and readings persist to Supabase.

---

## Phase 12 — Documentation & Handover
Include:
- Setup guide (`README.md`) with `npm` commands, env var list, and Supabase setup steps.
- Developer guide: folder structure and how to run locally.
- Admin guide: how to use dashboard and interpret analytics.

---

## Suggested Milestone Schedule (example)
- Week 1: Setup, Next.js scaffold, Supabase schema design.
- Week 2: Auth + RBAC, basic meter reader flow.
- Week 3: Photo upload, account search, admin list views.
- Week 4: Map integration, charts, anomaly flags.
- Week 5: Testing, CI, and deployment.

---

## Next Steps (immediate recommendations)
1. Confirm tech choices (Tailwind vs other, Mapbox vs Leaflet, Chart library).
2. I'll scaffold the Next.js app and push initial commit (if you want).
3. Create Supabase project and share `NEXT_PUBLIC_SUPABASE_URL` and anon key in `.env.local` (do not commit keys).

---

## Useful Commands Summary
- Scaffold Next.js:
```bash
npx create-next-app@latest app --typescript
```
- Install libs:
```bash
cd app
npm install @supabase/supabase-js tailwindcss chart.js react-chartjs-2 leaflet react-leaflet
```
- Supabase CLI (optional): `npm i -g supabase` then `supabase login` and `supabase init`
- Deploy: push to GitHub and connect to Vercel.
```

---

If you want, I can now scaffold the Next.js app, create the initial commit, and wire basic Supabase client code. Tell me which choices to lock in (Tailwind? Mapbox or Leaflet?), and I will continue.
