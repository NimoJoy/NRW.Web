"use client";

import { useMemo, useState } from "react";
import { StatusBadge } from "@/components/ui/status-badge";
import { Table } from "@/components/ui/table";
import type { AdminReaderActivityItem } from "@/lib/phase9/types";

const userStatusTone = {
  active: "success",
  inactive: "neutral",
} as const;

const roleFilters = ["meter_reader", "all", "admin"] as const;
type RoleFilter = (typeof roleFilters)[number];

const statusFilters = ["all", "active", "inactive"] as const;
type StatusFilter = (typeof statusFilters)[number];

const PAGE_SIZE = 2;

type MeterReaderActivityClientProps = {
  initialUsers: AdminReaderActivityItem[];
};

export function MeterReaderActivityClient({ initialUsers }: MeterReaderActivityClientProps) {
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("meter_reader");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return initialUsers.filter((user) => {
      const passesRole = roleFilter === "all" || user.role === roleFilter;
      const passesStatus = statusFilter === "all" || user.status === statusFilter;
      const passesQuery =
        !normalizedQuery ||
        user.name.toLowerCase().includes(normalizedQuery) ||
        user.recentActivity.toLowerCase().includes(normalizedQuery);

      return passesRole && passesStatus && passesQuery;
    });
  }, [initialUsers, query, roleFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * PAGE_SIZE;
  const currentUsers = filteredUsers.slice(startIndex, startIndex + PAGE_SIZE);

  const rows = currentUsers.map((user) => [
    user.name,
    user.role === "meter_reader" ? "Meter Reader" : "Admin",
    user.recentActivity,
    <StatusBadge
      key={`${user.name}-status`}
      label={user.status}
      tone={userStatusTone[user.status]}
    />,
  ]);

  function resetToFirstPage() {
    setCurrentPage(1);
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            resetToFirstPage();
          }}
          placeholder="Search name or activity"
          className="w-full rounded-md border border-black/20 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
        />

        <select
          value={roleFilter}
          onChange={(event) => {
            setRoleFilter(event.target.value as RoleFilter);
            resetToFirstPage();
          }}
          className="w-full rounded-md border border-black/20 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
        >
          {roleFilters.map((option) => (
            <option key={option} value={option}>
              {option === "all"
                ? "All roles"
                : option === "meter_reader"
                  ? "Meter Reader"
                  : "Admin"}
            </option>
          ))}
        </select>

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
          {filteredUsers.length} user(s) found
        </p>
      </div>

      <Table headers={["Name", "Role", "Recent Activity", "Status"]} rows={rows} />

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
  );
}
