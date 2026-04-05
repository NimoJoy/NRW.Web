import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { dashboardMetrics } from "@/lib/mock-data/data";

export default function DashboardPage() {
  return (
    <section className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="UI-only dashboard shell using static data placeholders before backend wiring."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {dashboardMetrics.map((metric) => (
          <Card key={metric.label} title={metric.label}>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-3xl font-semibold tracking-tight">{metric.value}</p>
                <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                  Updated from current operational dataset
                </p>
              </div>
              <StatusBadge label={metric.label} tone={metric.tone} />
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card
          title="Foundation Status"
          description="Phase 2 tracks shared UI and route skeleton readiness."
        >
          <ul className="space-y-2 text-sm leading-6 text-[color:var(--muted)]">
            <li>• Shared components created and reusable.</li>
            <li>• Route groups structured for auth, admin, meter reader, map, and reports.</li>
            <li>• Mock data available for all page shells.</li>
          </ul>
        </Card>

        <Card title="Next Approval Gate" description="Phase 3 starts only after your approval.">
          <p className="text-sm leading-6 text-[color:var(--muted)]">
            Meter reader and admin feature details remain as placeholder UI until you authorize the
            next phase.
          </p>
        </Card>
      </div>
    </section>
  );
}
