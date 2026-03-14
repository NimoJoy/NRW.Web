# NRW Water Billing — Overall Workplan

## Project Objective
Build a Next.js + Supabase web application for a water billing organization with two role-based experiences:
- **Organization Admin**: dashboard, account/bill oversight, map visibility, and reporting.
- **Meter Reader**: account lookup, meter reading entry, and meter photo capture/upload.

## Must-Have Scope
- Authentication and role-based access control (Admin, Meter Reader).
- Meter reading workflow with previous reading lookup, current reading capture, and photo upload.
- Admin dashboard for accounts, bills, and reading visibility.
- Pipeline map visualization.
- Reporting with anomaly flags.

## Baseline Technical Stack
- Frontend: Next.js (App Router) + TypeScript
- Styling: Tailwind CSS
- Backend/Auth/Database/Storage: Supabase
- Maps: Leaflet + OpenStreetMap (switch to Mapbox only if required)
- Charts: Chart.js
- Deployment: Vercel

---

## Progress Tracking Rules
- Mark task checkboxes as work is completed.
- Mark each phase completion checkbox only when all tasks in that phase are complete.
- Git repository setup is already complete.

## Pre-Completed
- [x] Git setup and repository initialization completed.

---

## Delivery Phases (UI/Frontend First, Checkable)

### Phase 1 — Project Setup + Next.js Scaffold
**Goal:** Initialize the app shell for frontend development.

**Checklist**
- [x] Scaffold Next.js app with TypeScript.
- [x] Set up Tailwind CSS.
- [x] Create route groups for auth and app areas.
- [x] Add base layout shell (header/sidebar/content region).
- [x] Add `.env.local.example` with required key names only.
- [x] Verify app runs on `http://localhost:3000`.
- [x] **Phase 1 complete**.

### Phase 2 — Frontend Foundation (UI-Only)
**Goal:** Build reusable frontend structure before backend integration.

**Checklist**
- [ ] Define page routing structure for auth, meter reader, admin, map, and reports.
- [ ] Build shared components (`AppShell`, `PageHeader`, `Card`, `Table`, `FormField`, `StatusBadge`).
- [ ] Add static/mock data files for UI wiring.
- [ ] Add loading, empty, and error UI states.
- [ ] Ensure responsive layout baseline (mobile/tablet/desktop).
- [ ] **Phase 2 complete**.

### Phase 3 — Meter Reader Pages (UI-Only)
**Goal:** Complete meter reader screens with mock data.

**Checklist**
- [ ] Create account search page UI.
- [ ] Create reading entry form UI (previous/current/pressure fields).
- [ ] Add photo capture/upload input UI.
- [ ] Add submit summary and confirmation UI.
- [ ] Validate form UX (required fields, inline validation messages).
- [ ] **Phase 3 complete**.

### Phase 4 — Admin Pages (UI-Only)
**Goal:** Complete admin dashboard screens with mock data.

**Checklist**
- [ ] Create accounts list and account details pages.
- [ ] Create bills management page (list/create/status UI).
- [ ] Create meter reader activity page.
- [ ] Add search/filter/pagination UI controls.
- [ ] **Phase 4 complete**.

### Phase 5 — Map + Reporting Pages (UI-Only)
**Goal:** Complete map and analytics screens before data wiring.

**Checklist**
- [ ] Create pipeline map page shell.
- [ ] Add placeholder layers/markers and side detail panel UI.
- [ ] Create reporting page with chart components and filter controls.
- [ ] Create anomaly table/list UI with status indicators.
- [ ] **Phase 5 complete**.

### Phase 6 — Supabase Setup + Schema + Storage
**Goal:** Establish backend after UI pages are ready.

**Checklist**
- [ ] Create Supabase project.
- [ ] Create schema tables: `profiles`, `accounts`, `meters`, `readings`, `bills`, `pipelines`.
- [ ] Create `meter-photos` storage bucket.
- [ ] Add baseline RLS policies by role and ownership.
- [ ] **Phase 6 complete**.

### Phase 7 — Authentication + RBAC Integration
**Goal:** Connect auth and route protection.

**Checklist**
- [ ] Implement sign-in flow (magic link or email/password).
- [ ] Populate `profiles` with role metadata.
- [ ] Protect routes and server actions by session + role.
- [ ] Validate role-based page access for Admin and Meter Reader.
- [ ] **Phase 7 complete**.

### Phase 8 — Meter Reader Data Integration
**Goal:** Connect meter reader UI to Supabase.

**Checklist**
- [ ] Wire account search to `accounts` table.
- [ ] Fetch previous reading from latest `readings` entry.
- [ ] Upload meter photos to storage bucket.
- [ ] Insert reading with computed consumption.
- [ ] **Phase 8 complete**.

### Phase 9 — Admin/Map/Reporting Data Integration
**Goal:** Connect admin, map, and reporting pages to real data.

**Checklist**
- [ ] Wire accounts, bills, and reader activity queries.
- [ ] Connect map overlays/markers to pipeline and account data.
- [ ] Connect reporting charts and filters to readings data.
- [ ] Persist anomaly flags (`is_anomaly`, `anomaly_reason`).
- [ ] **Phase 9 complete**.

### Phase 10 — Photo Privacy + Retention
**Goal:** Enforce safe image handling.

**Checklist**
- [ ] Use private/expiring URL patterns for meter photos.
- [ ] Define retention and deletion behavior.
- [ ] Strip or avoid sensitive metadata where required.
- [ ] **Phase 10 complete**.

### Phase 11 — Quality + CI
**Goal:** Ensure reliability and release readiness.

**Checklist**
- [ ] Enforce linting, formatting, and strict typing.
- [ ] Add component tests for critical UI paths.
- [ ] Add E2E tests for core user journeys.
- [ ] Configure PR CI checks.
- [ ] **Phase 11 complete**.

### Phase 12 — Deployment
**Goal:** Release to a stable hosted environment.

**Checklist**
- [ ] Connect repo to Vercel.
- [ ] Configure environment variables per environment.
- [ ] Enable preview deployments for pull requests.
- [ ] Validate production core flows.
- [ ] **Phase 12 complete**.

### Phase 13 — Documentation + Handover
**Goal:** Ensure maintainability and onboarding readiness.

**Checklist**
- [ ] Finalize setup and run instructions in `README.md`.
- [ ] Add developer notes for project structure/conventions.
- [ ] Add admin usage guide for dashboard and reports.
- [ ] **Phase 13 complete**.

---

## Suggested Milestone Cadence (5 Weeks)
- **Week 1:** Phases 1–3
- **Week 2:** Phases 4–5
- **Week 3:** Phases 6–8
- **Week 4:** Phases 9–10
- **Week 5:** Phases 11–13

## Immediate Next Actions
- [x] Start Phase 1 (scaffold Next.js + Tailwind).
- [ ] Define route skeleton for all UI pages (Phase 2).
- [ ] Begin meter reader and admin page wiring with mock data.
