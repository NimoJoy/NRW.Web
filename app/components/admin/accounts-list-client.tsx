"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { StatusBadge } from "@/components/ui/status-badge";
import { Table } from "@/components/ui/table";
import type { AdminAccountListItem } from "@/lib/phase9/types";

const accountStatusTone = {
  active: "success",
  pending: "warning",
  suspended: "danger",
} as const;

const statusFilters = ["all", "active", "pending", "suspended"] as const;
type StatusFilter = (typeof statusFilters)[number];

const PAGE_SIZE = 2;

type AccountsListClientProps = {
  initialAccounts: AdminAccountListItem[];
};

function matchesQuery(account: AdminAccountListItem, query: string) {
  if (!query) {
    return true;
  }

  const normalizedQuery = query.toLowerCase();

  return (
    account.accountNumber.toLowerCase().includes(normalizedQuery) ||
    account.customerName.toLowerCase().includes(normalizedQuery) ||
    account.pipeline.toLowerCase().includes(normalizedQuery)
  );
}

export function AccountsListClient({ initialAccounts }: AccountsListClientProps) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredAccounts = useMemo(
    () =>
      initialAccounts.filter((account) => {
        const passesQuery = matchesQuery(account, query.trim());
        const passesStatus = statusFilter === "all" || account.status === statusFilter;

        return passesQuery && passesStatus;
      }),
    [initialAccounts, query, statusFilter]
  );

  const totalPages = Math.max(1, Math.ceil(filteredAccounts.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * PAGE_SIZE;
  const currentAccounts = filteredAccounts.slice(startIndex, startIndex + PAGE_SIZE);

  const rows = currentAccounts.map((account) => [
    <Link
      key={`${account.accountNumber}-number`}
      href={`/admin/accounts/${account.accountNumber}`}
      className="font-medium underline-offset-2 hover:underline"
    >
      {account.accountNumber}
    </Link>,
    account.customerName,
    account.pipeline,
    <StatusBadge
      key={`${account.accountNumber}-status`}
      label={account.status}
      tone={accountStatusTone[account.status]}
    />,
    <Link
      key={`${account.accountNumber}-details`}
      href={`/admin/accounts/${account.accountNumber}`}
      className="underline-offset-2 hover:underline"
    >
      View details
    </Link>,
  ]);

  function handleQueryChange(nextQuery: string) {
    setQuery(nextQuery);
    setCurrentPage(1);
  }

  function handleStatusChange(nextStatus: StatusFilter) {
    setStatusFilter(nextStatus);
    setCurrentPage(1);
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <input
          value={query}
          onChange={(event) => handleQueryChange(event.target.value)}
          placeholder="Search account, customer, or pipeline"
          className="w-full px-3 py-2 text-sm"
        />

        <select
          value={statusFilter}
          onChange={(event) => handleStatusChange(event.target.value as StatusFilter)}
          className="w-full px-3 py-2 text-sm"
        >
          {statusFilters.map((option) => (
            <option key={option} value={option}>
              {option === "all" ? "All statuses" : option}
            </option>
          ))}
        </select>

        <p className="self-center text-sm text-foreground/70">
          {filteredAccounts.length} account(s) found
        </p>
      </div>

      <Table
        headers={["Account", "Customer", "Pipeline", "Status", "Details"]}
        rows={rows}
        emptyMessage="No accounts match your current filters."
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
            className="app-btn-secondary app-btn-compact disabled:cursor-not-allowed disabled:opacity-60"
          >
            Previous
          </button>

          <button
            type="button"
            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            disabled={safeCurrentPage === totalPages}
            className="app-btn-secondary app-btn-compact disabled:cursor-not-allowed disabled:opacity-60"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
