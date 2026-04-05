# Admin Usage Guide

This guide covers admin usage of the Dashboard and Reports pages.

## Access requirements

- Sign in at `/login` with an account that has admin role.
- Admin navigation includes:
  - `Dashboard` (`/dashboard`)
  - `Reports` (`/reports`)

If an authenticated user is not admin, route guards redirect to the role home route.

## Dashboard (`/dashboard`)

### What it shows

- Top KPI cards:
  - Accounts
  - Readings Today
  - Pending Bills
  - Critical Alerts
- Foundation status card
- Approval gate/status card

### Important note

- The current dashboard view is a UI shell with static placeholder metrics.
- Use Reports for live analytics and anomaly operations.

## Reports (`/reports`)

The reports page is data-backed from Supabase and supports filtering + anomaly management.

### Summary metrics

Top cards are calculated from current data:

- Accounts
- Readings
- Pending Bills
- Anomalies

### Filters

Use the **Report Filters** panel to narrow the dataset:

- Range: `Last 7 days`, `Last 30 days`, `Quarter to date`
- Pipeline selector: `All Pipelines` + detected pipeline names
- Severity: `all`, `warning`, `danger`

All report widgets below update based on these filters.

### Visual sections

- **Pressure Trend**: average pressure trend line by day
- **Pipeline Snapshot**: average pressure bars per pipeline
- **Latest Reading Time**: timestamp of the most recent reading in filtered data

### Anomaly operations

Use **Anomaly Flags** table to review and update anomaly states.

- `Flag` marks a reading as anomaly (persists to backend)
- `Clear` removes anomaly status
- Updates are sent to `PATCH /api/admin/readings/[id]/anomaly`
- The page displays mutation feedback messages after actions

## Recommended admin workflow

1. Open `Reports`.
2. Select appropriate date range and pipeline.
3. Inspect severity-filtered anomalies.
4. Use `Flag` or `Clear` in the anomaly table.
5. Confirm update message and re-check filters/views.

## Empty states and troubleshooting

- If no readings match filters, charts and tables may show empty/placeholder states.
- If anomaly updates fail, the UI restores previous state and shows an error message.
- Ensure Supabase data exists for accounts/readings/bills to see meaningful metrics.
