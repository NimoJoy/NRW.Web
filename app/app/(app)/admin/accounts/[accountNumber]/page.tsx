import { AccountFormClient } from "@/components/admin/account-form-client";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Table } from "@/components/ui/table";
import { fetchAdminAccountDetails, fetchPipelineOptions } from "@/lib/phase9/data";

const accountStatusTone = {
  active: "success",
  pending: "warning",
  suspended: "danger",
} as const;

const billStatusTone = {
  paid: "success",
  unpaid: "warning",
  overdue: "danger",
} as const;

type AccountDetailsPageProps = {
  params: {
    accountNumber: string;
  };
};

export default async function AccountDetailsPage({ params }: AccountDetailsPageProps) {
  const accountNumber = decodeURIComponent(params.accountNumber).toUpperCase();
  const [accountDetails, pipelineOptions] = await Promise.all([
    fetchAdminAccountDetails(accountNumber),
    fetchPipelineOptions(),
  ]);

  if (!accountDetails) {
    notFound();
  }

  const { account, bills } = accountDetails;

  const accountBillRows = bills.map((bill) => [
    bill.billingPeriod,
    bill.amountDue,
    <StatusBadge
      key={`${bill.id}-status`}
      label={bill.status}
      tone={billStatusTone[bill.status]}
    />,
  ]);

  return (
    <section className="space-y-6">
      <PageHeader
        title={`Account ${account.accountNumber}`}
        description={`${account.customerName} • ${account.pipeline}`}
        actions={
          <Link href="/admin/accounts" className="app-btn-secondary">
            Back to Accounts
          </Link>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Account Details" description="Live account details from Supabase.">
          <dl className="grid gap-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-foreground/70">Account Number</dt>
              <dd className="font-medium">{account.accountNumber}</dd>
            </div>

            <div className="flex items-center justify-between gap-3">
              <dt className="text-foreground/70">Customer</dt>
              <dd className="font-medium">{account.customerName}</dd>
            </div>

            <div className="flex items-center justify-between gap-3">
              <dt className="text-foreground/70">Pipeline</dt>
              <dd className="font-medium">{account.pipeline}</dd>
            </div>

            <div className="flex items-center justify-between gap-3">
              <dt className="text-foreground/70">Address</dt>
              <dd className="font-medium">{account.address?.trim() || "Not specified"}</dd>
            </div>

            <div className="flex items-center justify-between gap-3">
              <dt className="text-foreground/70">Status</dt>
              <dd>
                <StatusBadge label={account.status} tone={accountStatusTone[account.status]} />
              </dd>
            </div>
          </dl>
        </Card>

        <Card
          title="Edit Account"
          description="Update account metadata with permission checks and audit trail logging."
        >
          <AccountFormClient
            mode="edit"
            accountNumberForEdit={account.accountNumber}
            pipelineOptions={pipelineOptions}
            initialValues={{
              accountNumber: account.accountNumber,
              customerName: account.customerName,
              address: account.address ?? "",
              pipelineId: account.pipelineId ?? "",
              status: account.status,
              latitude: account.latitude !== null ? String(account.latitude) : "",
              longitude: account.longitude !== null ? String(account.longitude) : "",
            }}
          />
        </Card>

        <Card title="Billing History" description="Recent bills for this account from Supabase.">
          <Table
            headers={["Period", "Amount", "Status"]}
            rows={accountBillRows}
            emptyMessage="No bills available for this account."
          />
        </Card>
      </div>
    </section>
  );
}
