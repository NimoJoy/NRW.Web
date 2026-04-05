# Phase G Release Checklist and Rollback Plan

Date: 2026-03-22

## Go/No-Go checklist

- [x] Phase G automated checks green:
  - `npm run lint`
  - `npm run typecheck`
  - `npm run format:check`
  - `npm run test`
  - `npm run test:e2e`
- [x] Role-based UAT scripts completed:
  - Admin script (connections + dashboard edits)
  - Meter-reader script (pressure + correction flows)
- [x] Zero open Severity 1/2 defects.
- [x] Database migrations verified in target environment:
  - `phase7_connections_mapping.sql`
  - `phase8_pressure_stream.sql`
  - `phase9_editable_dashboards_audit.sql`
- [x] Audit trail spot-check completed for account, connection, bill, and reading correction edits.
- [x] Product and operations sign-off recorded.

## Rollback triggers

Trigger rollback if any of the following occurs post-release:

- Unauthorized cross-company data visibility.
- Meter-reader correction or admin edit flows failing with >5% error rate.
- Audit log write failures for mutable operations.
- Broken core login flow (company step or role routing).

## Rollback actions

1. Revert application deployment to last known stable build.
2. Disable new write endpoints temporarily if needed:
   - `/api/admin/accounts`
   - `/api/admin/accounts/[accountNumber]`
   - `/api/meter-reader/readings/[id]/correction`
3. Preserve production data; do not drop tables.
4. If issue is migration-related, keep schema in place and roll forward with a hotfix migration.
5. Run smoke validation after rollback:
   - unauth redirect/login
   - admin dashboard load
   - meter-reader submit load

## Recovery and re-release

1. Patch root cause with corresponding tests.
2. Re-run Phase G checklist end-to-end.
3. Re-approve go/no-go with product + ops.