# Phase A Issue Matrix

Date opened: 2026-03-21

## Legend
- Priority: P1 (critical), P2 (high), P3 (medium), P4 (low)
- Status: Open, In Progress, Blocked, Resolved

| Issue ID | Priority | Status | Area | Requirement Link | Root Cause | Action | Owner | Exit Criteria |
|---|---|---|---|---|---|---|---|---|
| A-01 | P1 | Open | Dashboard | Req 1 | Dashboard uses mock/static metrics, not backend data. | Implement live metrics query + role-aware aggregation and empty-state strategy. | Dev | Dashboard shows real records for admin and meter reader contexts. |
| A-02 | P1 | Open | Data Foundation | Req 1 | No seed scripts for baseline operational dataset. | Add idempotent seeding for accounts/meters/readings/bills/pipelines/profiles. | Dev/DBA | Fresh environment can be bootstrapped with one documented command. |
| A-03 | P1 | Open | Authentication | Req 4 | Login flow lacks company-first tenant selection. | Add company selection step before credential sign-in and bind to session. | Dev | Users must select company before role-routed access succeeds. |
| A-04 | P1 | Open | Map/Connections | Req 2 | No connection CRUD workflow in map UI/API. | Add connection schema + admin create/edit/list endpoints and map interactions. | Dev | Admin can create and edit connection points and view existing network. |
| A-05 | P1 | Open | Pressure Workflow | Req 3 | Pressure stored only inside readings flow; no separate stream. | Add pressure table/API/UI/reporting pipeline separated from household reading submit. | Dev | Pressure can be captured/reported independently of house meter reading entry. |
| A-06 | P2 | Open | Admin Editing | Req 5 | Accounts area lacks create/edit forms and APIs. | Add admin account CRUD form and API operations with validations and audit fields. | Dev | Admin can create/update account details from dashboard securely. |
| A-07 | P2 | Open | Meter Reader Editing | Req 5 | No controlled correction flow for reader submissions. | Add correction workflow with guardrails (time window or admin approval). | Dev | Reader can request/perform allowed corrections with audit trace. |
| A-08 | P2 | Open | Operations Diagnostics | Req 1 | Env/config issues can silently result in no visible operational data. | Add startup diagnostics and setup verification script/checklist. | DevOps/Dev | Misconfiguration surfaces actionable errors before runtime usage. |

## Notes
- Phase B remains blocked by user instruction until explicit approval is received.
- This matrix is Phase A output and should drive implementation sequencing once approved.
