"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { StatusBadge } from "@/components/ui/status-badge";
import { Table } from "@/components/ui/table";
import type { AdminBillListItem, BillStatus } from "@/lib/phase9/types";

const billStatusTone = {
  paid: "success",
  unpaid: "warning",
  overdue: "danger",
} as const;

const statusFilters = ["all", "paid", "unpaid", "overdue"] as const;
type StatusFilter = (typeof statusFilters)[number];

const PAGE_SIZE = 2;

type BillFormState = {
  accountNumber: string;
  billingPeriod: string;
  amountDue: string;
  status: BillStatus;
};

const initialFormState: BillFormState = {
  accountNumber: "",
  billingPeriod: "",
  amountDue: "",
  status: "unpaid",
};

type BillsManagementClientProps = {
  initialBills: AdminBillListItem[];
};

function createBillKey(bill: AdminBillListItem) {
  return bill.id;
}

function parseAmount(value: string) {
  const numericValue = Number(value.replace(/[^\d.-]/g, ""));
  return Number.isFinite(numericValue) ? numericValue : null;
}

function normalizeBillingPeriod(value: string) {
  const trimmedValue = value.trim();

  if (/^\d{4}-\d{2}$/.test(trimmedValue)) {
    return trimmedValue;
  }

  return null;
}

export function BillsManagementClient({ initialBills }: BillsManagementClientProps) {
  const [bills, setBills] = useState<AdminBillListItem[]>(initialBills);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [formState, setFormState] = useState<BillFormState>(initialFormState);
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [isCreatingBill, setIsCreatingBill] = useState(false);
  const [updatingBillId, setUpdatingBillId] = useState<string | null>(null);

  const filteredBills = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return bills.filter((bill) => {
      const matchesFilter = statusFilter === "all" || bill.status === statusFilter;
      const matchesQuery =
        !normalizedQuery ||
        bill.accountNumber.toLowerCase().includes(normalizedQuery) ||
        bill.billingPeriod.toLowerCase().includes(normalizedQuery);

      return matchesFilter && matchesQuery;
    });
  }, [bills, query, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredBills.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * PAGE_SIZE;
  const currentBills = filteredBills.slice(startIndex, startIndex + PAGE_SIZE);

  async function handleBillStatusChange(billKey: string, nextStatus: BillStatus) {
    const currentBill = bills.find((bill) => createBillKey(bill) === billKey);

    if (!currentBill || currentBill.status === nextStatus) {
      return;
    }

    setFormMessage(null);
    setUpdatingBillId(billKey);
    setBills((currentBillsState) =>
      currentBillsState.map((bill) =>
        createBillKey(bill) === billKey
          ? {
              ...bill,
              status: nextStatus,
            }
          : bill
      )
    );

    try {
      const response = await fetch(`/api/admin/bills/${encodeURIComponent(billKey)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: nextStatus }),
      });

      const payload = (await response.json()) as {
        message?: string;
        bill?: { status: BillStatus };
      };

      if (!response.ok) {
        setBills((currentBillsState) =>
          currentBillsState.map((bill) =>
            createBillKey(bill) === billKey
              ? {
                  ...bill,
                  status: currentBill.status,
                }
              : bill
          )
        );
        setFormMessage(payload.message ?? "Unable to update bill status.");
        return;
      }

      if (payload.bill?.status) {
        setBills((currentBillsState) =>
          currentBillsState.map((bill) =>
            createBillKey(bill) === billKey
              ? {
                  ...bill,
                  status: payload.bill?.status ?? bill.status,
                }
              : bill
          )
        );
      }
    } catch {
      setBills((currentBillsState) =>
        currentBillsState.map((bill) =>
          createBillKey(bill) === billKey
            ? {
                ...bill,
                status: currentBill.status,
              }
            : bill
        )
      );
      setFormMessage("Unable to update bill status right now.");
    } finally {
      setUpdatingBillId(null);
    }
  }

  const rows = currentBills.map((bill) => {
    const billKey = createBillKey(bill);

    return [
      bill.accountNumber,
      bill.billingPeriod,
      bill.amountDue,
      <StatusBadge
        key={`${billKey}-badge`}
        label={bill.status}
        tone={billStatusTone[bill.status]}
      />,
      <select
        key={`${billKey}-status`}
        value={bill.status}
        onChange={(event) => {
          void handleBillStatusChange(billKey, event.target.value as BillStatus);
        }}
        disabled={updatingBillId === billKey}
        className="w-full rounded-md border border-black/20 px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
      >
        <option value="paid">paid</option>
        <option value="unpaid">unpaid</option>
        <option value="overdue">overdue</option>
      </select>,
    ];
  });

  function resetToFirstPage() {
    setCurrentPage(1);
  }

  async function handleCreateBill(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const accountNumber = formState.accountNumber.trim().toUpperCase();
    const billingPeriod = normalizeBillingPeriod(formState.billingPeriod);
    const amountDue = parseAmount(formState.amountDue);

    if (!accountNumber || !billingPeriod || amountDue === null) {
      setFormMessage("Account number, billing period, and amount are required.");
      return;
    }

    const isDuplicate = bills.some(
      (bill) => bill.accountNumber === accountNumber && bill.billingPeriod === billingPeriod
    );

    if (isDuplicate) {
      setFormMessage("A bill already exists for this account and period.");
      return;
    }

    setIsCreatingBill(true);
    setFormMessage(null);

    try {
      const response = await fetch("/api/admin/bills", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accountNumber,
          billingPeriod,
          amountDue,
          status: formState.status,
        }),
      });

      const payload = (await response.json()) as {
        message?: string;
        bill?: AdminBillListItem;
      };

      if (!response.ok || !payload.bill) {
        setFormMessage(payload.message ?? "Unable to create bill.");
        return;
      }

      setBills((currentBillsState) => [payload.bill!, ...currentBillsState]);
      setFormState(initialFormState);
      setFormMessage("Bill created successfully.");
      resetToFirstPage();
    } catch {
      setFormMessage("Unable to create bill right now.");
    } finally {
      setIsCreatingBill(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card title="Create Bill" description="Create and persist bills to Supabase.">
        <form onSubmit={handleCreateBill} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FormField id="billAccountNumber" label="Account Number" required>
            <input
              id="billAccountNumber"
              value={formState.accountNumber}
              onChange={(event) =>
                setFormState((current) => ({ ...current, accountNumber: event.target.value }))
              }
              placeholder="ACC-1001"
              className="w-full rounded-md border border-black/20 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
              required
            />
          </FormField>

          <FormField id="billPeriod" label="Billing Period" required hint="Example: 2026-03">
            <input
              id="billPeriod"
              value={formState.billingPeriod}
              onChange={(event) =>
                setFormState((current) => ({ ...current, billingPeriod: event.target.value }))
              }
              placeholder="2026-03"
              className="w-full rounded-md border border-black/20 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
              required
            />
          </FormField>

          <FormField id="billAmount" label="Amount Due" required hint="Example: KSh 12000">
            <input
              id="billAmount"
              value={formState.amountDue}
              onChange={(event) =>
                setFormState((current) => ({ ...current, amountDue: event.target.value }))
              }
              placeholder="12000.00"
              className="w-full rounded-md border border-black/20 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
              required
            />
          </FormField>

          <FormField id="billStatus" label="Initial Status" required>
            <select
              id="billStatus"
              value={formState.status}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  status: event.target.value as BillStatus,
                }))
              }
              className="w-full rounded-md border border-black/20 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
            >
              <option value="unpaid">unpaid</option>
              <option value="paid">paid</option>
              <option value="overdue">overdue</option>
            </select>
          </FormField>

          <button
            type="submit"
            disabled={isCreatingBill}
            className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background sm:col-span-2 lg:col-span-1"
          >
            {isCreatingBill ? "Creating..." : "Create Bill"}
          </button>
        </form>

        {formMessage ? (
          <p className="mt-3 rounded-md border border-black/20 bg-foreground/[0.03] px-3 py-2 text-sm text-foreground/80">
            {formMessage}
          </p>
        ) : null}
      </Card>

      <Card title="Bills List" description="Search, filter, paginate, and update bill status.">
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                resetToFirstPage();
              }}
              placeholder="Search by account or billing period"
              className="w-full rounded-md border border-black/20 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
            />

            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value as StatusFilter);
                resetToFirstPage();
              }}
              className="w-full rounded-md border border-black/20 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
            >
              {statusFilters.map((option) => (
                <option key={option} value={option}>
                  {option === "all" ? "All statuses" : option}
                </option>
              ))}
            </select>

            <p className="self-center text-sm text-foreground/70">
              {filteredBills.length} bill(s) found
            </p>
          </div>

          <Table
            headers={["Account", "Period", "Amount", "Status", "Change Status"]}
            rows={rows}
            emptyMessage="No bills match your filters."
          />

          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-foreground/70">
              Page {safeCurrentPage} of {totalPages}
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={safeCurrentPage === 1}
                className="rounded-md border border-black/20 px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-60"
              >
                Previous
              </button>

              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={safeCurrentPage === totalPages}
                className="rounded-md border border-black/20 px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-60"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
