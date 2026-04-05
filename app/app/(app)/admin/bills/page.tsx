import { BillsManagementClient } from "@/components/admin/bills-management-client";
import { PageHeader } from "@/components/ui/page-header";
import { fetchAdminBillsData } from "@/lib/phase9/data";

export default async function AdminBillsPage() {
  const bills = await fetchAdminBillsData();

  return (
    <section className="space-y-6">
      <PageHeader
        title="Admin Bills"
        description="Bill creation, status updates, and list controls backed by Supabase data."
      />

      <BillsManagementClient initialBills={bills} />
    </section>
  );
}
