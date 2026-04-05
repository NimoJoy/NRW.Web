import { Card } from "@/components/ui/card";
import { MeterReaderActivityClient } from "@/components/admin/meter-reader-activity-client";
import { PageHeader } from "@/components/ui/page-header";
import { fetchAdminReaderActivityData } from "@/lib/phase9/data";

export default async function AdminUsersPage() {
  const users = await fetchAdminReaderActivityData();

  return (
    <section className="space-y-6">
      <PageHeader
        title="Meter Reader Activity"
        description="Reader activity monitoring with search, role/status filters, and pagination controls."
      />

      <Card
        title="Reader Activity Feed"
        description="Recent activity derived from Supabase profiles and readings."
      >
        <MeterReaderActivityClient initialUsers={users} />
      </Card>
    </section>
  );
}
