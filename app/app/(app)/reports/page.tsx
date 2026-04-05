import { Card } from "@/components/ui/card";
import { ReportsDashboardClient } from "@/components/reports/reports-dashboard-client";
import { PageHeader } from "@/components/ui/page-header";
import { fetchReportsDataset } from "@/lib/phase9/data";

export default async function ReportsPage() {
  const dataset = await fetchReportsDataset();

  return (
    <section className="space-y-6">
      <PageHeader
        title="Reports"
        description="Analytics dashboard with live readings, filters, and anomaly indicators."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {dataset.metrics.map((metric) => (
          <Card key={`report-${metric.label}`} title={metric.label}>
            <p className="text-2xl font-semibold">{metric.value}</p>
          </Card>
        ))}
      </div>

      <ReportsDashboardClient dataset={dataset} />
    </section>
  );
}
