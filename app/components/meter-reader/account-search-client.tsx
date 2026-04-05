"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FormField } from "@/components/ui/form-field";
import { StatusBadge } from "@/components/ui/status-badge";
import { quickFilters } from "@/lib/mock-data/data";

type SearchResult = {
  accountNumber: string;
  customerName: string;
  pipeline: string;
  status: string;
  previousReading: number;
  lastPressurePsi: number | null;
  lastRecordedAt: string | null;
};

export function AccountSearchClient() {
  const [accountNumber, setAccountNumber] = useState("");
  const [selectedFilter, setSelectedFilter] = useState(quickFilters[0]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedAccountNumber = accountNumber.trim().toUpperCase();

    if (!normalizedAccountNumber) {
      setErrorMessage("Account number is required.");
      setSearchResult(null);
      return;
    }

    setIsSearching(true);
    setErrorMessage(null);

    try {
      const response = await fetch(
        `/api/meter-reader/account-lookup?accountNumber=${encodeURIComponent(normalizedAccountNumber)}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const payload = (await response.json()) as SearchResult & { message?: string };

      if (!response.ok) {
        setErrorMessage(payload.message ?? "Unable to fetch account details.");
        setSearchResult(null);
        return;
      }

      setSearchResult(payload);
    } catch {
      setErrorMessage(
        "Unable to fetch account details right now. Check your connection and try again."
      );
      setSearchResult(null);
    } finally {
      setIsSearching(false);
    }
  }

  const submitHref = searchResult
    ? `/meter-reader/submit?accountNumber=${encodeURIComponent(searchResult.accountNumber)}&previousReading=${searchResult.previousReading}`
    : "/meter-reader/submit";

  function statusTone(status: string) {
    if (status === "suspended") {
      return "danger" as const;
    }

    if (status === "pending") {
      return "warning" as const;
    }

    return "success" as const;
  }

  return (
    <div className="space-y-6">
      <Card
        title="Search Account"
        description="Enter an account number to fetch previous reading details."
      >
        <form onSubmit={handleSearch} className="grid gap-4 sm:grid-cols-2">
          <FormField
            id="accountNumber"
            label="Account Number"
            required
            error={errorMessage ?? undefined}
          >
            <input
              id="accountNumber"
              value={accountNumber}
              onChange={(event) => setAccountNumber(event.target.value)}
              placeholder="e.g. ACC-1001"
              className="w-full px-3 py-2 text-sm"
              required
            />
          </FormField>

          <FormField id="filter" label="Quick Filter">
            <select
              id="filter"
              value={selectedFilter}
              onChange={(event) => setSelectedFilter(event.target.value)}
              className="w-full px-3 py-2 text-sm"
            >
              {quickFilters.map((filter) => (
                <option key={filter} value={filter}>
                  {filter}
                </option>
              ))}
            </select>
          </FormField>

          <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={isSearching}
              className="app-btn-primary w-full sm:w-auto"
            >
              {isSearching ? "Searching..." : "Search"}
            </button>

            <p className="text-sm text-foreground/70">Current filter: {selectedFilter}</p>
          </div>
        </form>
      </Card>

      {searchResult ? (
        <Card
          title="Account Match"
          description="Live data from Supabase account and reading records."
        >
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <p>
              <span className="text-foreground/70">Account:</span> {searchResult.accountNumber}
            </p>
            <p>
              <span className="text-foreground/70">Customer:</span> {searchResult.customerName}
            </p>
            <p>
              <span className="text-foreground/70">Pipeline:</span> {searchResult.pipeline}
            </p>
            <p className="flex items-center gap-2">
              <span className="text-foreground/70">Status:</span>
              <StatusBadge label={searchResult.status} tone={statusTone(searchResult.status)} />
            </p>
            <p>
              <span className="text-foreground/70">Previous Reading:</span>{" "}
              {searchResult.previousReading}
            </p>
            <p>
              <span className="text-foreground/70">Last Pressure:</span>{" "}
              {searchResult.lastPressurePsi !== null
                ? `${searchResult.lastPressurePsi} psi`
                : "No pressure reading"}
            </p>
            <p>
              <span className="text-foreground/70">Last Recorded:</span>{" "}
              {searchResult.lastRecordedAt
                ? new Date(searchResult.lastRecordedAt).toLocaleString()
                : "No prior reading"}
            </p>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <StatusBadge label="Ready for submission" tone="info" />
            <Link
              href={submitHref}
              className="app-btn-secondary"
            >
              Continue to Submit Page
            </Link>
          </div>
        </Card>
      ) : (
        <EmptyState
          title="No account selected"
          description="Run a search to populate customer and previous reading details."
        />
      )}
    </div>
  );
}
