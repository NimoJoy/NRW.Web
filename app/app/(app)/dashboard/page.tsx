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
            <div className="flex items-center justify-between">
              <p className="text-2xl font-semibold">{metric.value}</p>
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
          <ul className="space-y-2 text-sm text-foreground/80">
            <li>• Shared components created and reusable.</li>
            <li>• Route groups structured for auth, admin, meter reader, map, and reports.</li>
            <li>• Mock data available for all page shells.</li>
          </ul>
        </Card>

        <Card title="Next Approval Gate" description="Phase 3 starts only after your approval.">
          <p className="text-sm text-foreground/70">
            Meter reader and admin feature details remain as placeholder UI until you authorize the
            next phase.
          </p>
        </Card>
      </div>
    </section>
  );
}
