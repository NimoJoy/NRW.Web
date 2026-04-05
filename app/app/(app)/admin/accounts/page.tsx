import { AccountFormClient } from "@/components/admin/account-form-client";
import { AccountsListClient } from "@/components/admin/accounts-list-client";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { fetchAdminAccountsData, fetchPipelineOptions } from "@/lib/phase9/data";

export default async function AdminAccountsPage() {
  const [accounts, pipelineOptions] = await Promise.all([
    fetchAdminAccountsData(),
    fetchPipelineOptions(),
  ]);

  return (
    <section className="space-y-6">
      <PageHeader
        title="Admin Accounts"
        description="Accounts list with search, filters, pagination, and account details navigation."
      />

      <Card
        title="Create Account"
        description="Add a new account with validation and audit logging."
      >
        <AccountFormClient
          mode="create"
          pipelineOptions={pipelineOptions}
          initialValues={{
            accountNumber: "",
            customerName: "",
            address: "",
            pipelineId: "",
            status: "active",
            latitude: "",
            longitude: "",
          }}
        />
      </Card>

      <Card
        title="Accounts Directory"
        description="Live account records from Supabase with local filter controls."
      >
        <AccountsListClient initialAccounts={accounts} />
      </Card>
    </section>
  );
}
