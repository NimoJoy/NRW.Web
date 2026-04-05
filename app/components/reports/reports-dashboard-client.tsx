"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { Table } from "@/components/ui/table";
import { formatDateTime, safeRound } from "@/lib/phase9/format";
import type { PressureReportItem, ReportsDataset } from "@/lib/phase9/types";

const severityTone = {
  warning: "warning",
  danger: "danger",
} as const;

const reportRangeOptions = ["Last 7 days", "Last 30 days", "Quarter to date"];

type SeverityFilter = "all" | "warning" | "danger";

type ReportsDashboardClientProps = {
  dataset: ReportsDataset;
};

function rangeToDays(range: string) {
  if (range === "Last 7 days") {
    return 7;
  }

  if (range === "Last 30 days") {
    return 30;
  }

  return 90;
}

function getSeverity(reading: PressureReportItem): Exclude<SeverityFilter, "all"> {
  const pressure = reading.pressurePsi;

  if (reading.isAnomaly || pressure <= 25 || pressure >= 85) {
    return "danger";
  }

  if (pressure <= 35 || pressure >= 75) {
    return "warning";
  }

  return "warning";
}

export function ReportsDashboardClient({ dataset }: ReportsDashboardClientProps) {
  const [rangeFilter, setRangeFilter] = useState(reportRangeOptions[0]);
  const [pipelineFilter, setPipelineFilter] = useState(
    dataset.pipelineOptions[0] ?? "All Pipelines"
  );
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("all");
  const [localPressureReadings, setLocalPressureReadings] = useState<PressureReportItem[]>(
    dataset.pressureReadings
  );
  const [mutationMessage, setMutationMessage] = useState<string | null>(null);
  const [savingReadingId, setSavingReadingId] = useState<string | null>(null);

  const pressureReadingsInRange = useMemo(() => {
    const days = rangeToDays(rangeFilter);
    const nowTimestamp = Date.now();

    return localPressureReadings.filter((reading) => {
      const recordedTimestamp = new Date(reading.recordedAt).getTime();

      if (!Number.isFinite(recordedTimestamp)) {
        return false;
      }

      const ageInDays = (nowTimestamp - recordedTimestamp) / (1000 * 60 * 60 * 24);
      return ageInDays <= days;
    });
  }, [localPressureReadings, rangeFilter]);

  const filteredPressureReadings = useMemo(
    () =>
      pressureReadingsInRange.filter((reading) => {
        const matchesPipeline =
          pipelineFilter === "All Pipelines" || reading.pipeline === pipelineFilter;
        const severity = getSeverity(reading);
        const matchesSeverity = severityFilter === "all" || severity === severityFilter;
        return matchesPipeline && matchesSeverity;
      }),
    [pipelineFilter, pressureReadingsInRange, severityFilter]
  );

  const trendSeries = useMemo(() => {
    const groupedByDay = new Map<string, number[]>();

    filteredPressureReadings.forEach((reading) => {
      const date = new Date(reading.recordedAt);

      if (Number.isNaN(date.getTime())) {
        return;
      }

      const label = date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
      const currentValues = groupedByDay.get(label) ?? [];
      currentValues.push(reading.pressurePsi);
      groupedByDay.set(label, currentValues);
    });

    return Array.from(groupedByDay.entries()).map(([label, values]) => ({
      label,
      value: safeRound(values.reduce((sum, value) => sum + value, 0) / values.length, 1),
    }));
  }, [filteredPressureReadings]);

  const trendValues = trendSeries.map((item) => item.value);

  const trendPoints = useMemo(() => {
    if (trendValues.length === 0) {
      return "";
    }

    const minValue = Math.min(...trendValues);
    const maxValue = Math.max(...trendValues);
    const denominator = Math.max(1, maxValue - minValue);

    return trendValues
      .map((value, index) => {
        const x = trendValues.length === 1 ? 50 : (index / (trendValues.length - 1)) * 100;
        const y = 92 - ((value - minValue) / denominator) * 74;
        return `${x},${y}`;
      })
      .join(" ");
  }, [trendValues]);

  const snapshotBars = useMemo(() => {
    const grouped = new Map<string, number[]>();

    filteredPressureReadings.forEach((reading) => {
      const values = grouped.get(reading.pipeline) ?? [];
      values.push(reading.pressurePsi);
      grouped.set(reading.pipeline, values);
    });

    return Array.from(grouped.entries())
      .map(([label, values]) => ({
        label,
        value: safeRound(values.reduce((sum, current) => sum + current, 0) / values.length, 1),
      }))
      .sort((left, right) => left.label.localeCompare(right.label))
      .slice(0, 6);
  }, [filteredPressureReadings]);

  const filteredPressureAnomalies = useMemo(
    () =>
      filteredPressureReadings
        .filter((reading) => reading.isAnomaly || getSeverity(reading) === "danger")
        .sort(
          (left, right) =>
            new Date(right.recordedAt).getTime() - new Date(left.recordedAt).getTime()
        ),
    [filteredPressureReadings]
  );

  async function handleAnomalyToggle(
    readingId: string,
    nextValue: boolean,
    currentReason: string | null
  ) {
    setMutationMessage(null);
    setSavingReadingId(readingId);

    const defaultReason = nextValue
      ? currentReason?.trim() || "Flagged from reports dashboard"
      : null;

    setLocalPressureReadings((currentReadings) =>
      currentReadings.map((reading) =>
        reading.id === readingId
          ? {
              ...reading,
              isAnomaly: nextValue,
              anomalyReason: defaultReason,
            }
          : reading
      )
    );

    try {
      const response = await fetch(
        `/api/admin/pressure-readings/${encodeURIComponent(readingId)}/anomaly`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            isAnomaly: nextValue,
            anomalyReason: defaultReason,
          }),
        }
      );

      const payload = (await response.json()) as {
        message?: string;
        pressureReading?: {
          id: string;
          isAnomaly: boolean;
          anomalyReason: string | null;
        };
      };

      if (!response.ok || !payload.pressureReading) {
        setMutationMessage(payload.message ?? "Unable to update anomaly flag.");
        setLocalPressureReadings((currentReadings) =>
          currentReadings.map((reading) =>
            reading.id === readingId
              ? {
                  ...reading,
                  isAnomaly: !nextValue,
                }
              : reading
          )
        );
        return;
      }

      setLocalPressureReadings((currentReadings) =>
        currentReadings.map((reading) =>
          reading.id === payload.pressureReading?.id
            ? {
                ...reading,
                isAnomaly: payload.pressureReading?.isAnomaly ?? reading.isAnomaly,
                anomalyReason: payload.pressureReading?.anomalyReason ?? reading.anomalyReason,
              }
            : reading
        )
      );
      setMutationMessage(payload.message ?? "Anomaly flag updated.");
    } catch {
      setMutationMessage("Unable to update anomaly flag right now.");
      setLocalPressureReadings((currentReadings) =>
        currentReadings.map((reading) =>
          reading.id === readingId
            ? {
                ...reading,
                isAnomaly: !nextValue,
              }
            : reading
        )
      );
    } finally {
      setSavingReadingId(null);
    }
  }

  const anomalyTableRows = filteredPressureAnomalies.map((entry) => {
    const severity = getSeverity(entry);

    return [
      entry.accountNumber,
      entry.pipeline,
      `${entry.pressurePsi} psi`,
      entry.anomalyReason?.trim() || "No reason recorded",
      <StatusBadge key={`${entry.id}-severity`} label={severity} tone={severityTone[severity]} />,
      <button
        key={`${entry.id}-toggle`}
        type="button"
        onClick={() => {
          void handleAnomalyToggle(entry.id, !entry.isAnomaly, entry.anomalyReason);
        }}
        disabled={savingReadingId === entry.id}
        className="rounded-md border border-black/20 px-2 py-1 text-xs hover:bg-foreground/10 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {entry.isAnomaly ? "Clear" : "Flag"}
      </button>,
    ];
  });

  return (
    <div className="space-y-6">
      <Card
        title="Report Filters"
        description="Filter live pressure stream by range, pipeline, and severity."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <select
            value={rangeFilter}
            onChange={(event) => setRangeFilter(event.target.value)}
            className="w-full rounded-md border border-black/20 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
          >
            {reportRangeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <select
            value={pipelineFilter}
            onChange={(event) => setPipelineFilter(event.target.value)}
            className="w-full rounded-md border border-black/20 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
          >
            {dataset.pipelineOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <select
            value={severityFilter}
            onChange={(event) =>
              setSeverityFilter(event.target.value as "all" | "warning" | "danger")
            }
            className="w-full rounded-md border border-black/20 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
          >
            <option value="all">All severities</option>
            <option value="warning">warning</option>
            <option value="danger">danger</option>
          </select>

          <p className="self-center text-sm text-foreground/70">
            {rangeFilter} • {pipelineFilter}
          </p>
        </div>
      </Card>

      {mutationMessage ? (
        <div className="rounded-md border border-black/20 bg-foreground/[0.03] px-3 py-2 text-sm text-foreground/80">
          {mutationMessage}
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-2">
        <Card
          title="Pressure Trend"
          description="Average pressure trend based on filtered live readings."
        >
          <div className="space-y-3">
            <div className="h-52 rounded-md border border-dashed border-black/20 bg-foreground/[0.03] p-3">
              <svg
                viewBox="0 0 100 100"
                className="h-full w-full"
                aria-label="Pressure trend placeholder chart"
              >
                <line
                  x1="0"
                  y1="92"
                  x2="100"
                  y2="92"
                  className="text-foreground/30"
                  stroke="currentColor"
                />
                <line
                  x1="6"
                  y1="8"
                  x2="6"
                  y2="95"
                  className="text-foreground/30"
                  stroke="currentColor"
                />
                {trendPoints ? (
                  <polyline
                    points={trendPoints}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-foreground"
                  />
                ) : null}
              </svg>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center text-xs text-foreground/70 sm:grid-cols-7">
              {trendSeries.slice(0, 7).map((row) => (
                <span key={row.label}>{row.label}</span>
              ))}
            </div>
          </div>
        </Card>

        <Card
          title="Pipeline Snapshot"
          description="Average pressure snapshot by pipeline for current filters."
        >
          <div className="space-y-3">
            {snapshotBars.map((bar) => (
              <div key={bar.label} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span>{bar.label}</span>
                  <span className="text-foreground/70">{bar.value} psi</span>
                </div>
                <div className="h-2 rounded-full bg-foreground/10">
                  <div
                    className="h-2 rounded-full bg-foreground"
                    style={{ width: `${Math.min(100, bar.value)}%` }}
                  />
                </div>
              </div>
            ))}

            {snapshotBars.length === 0 ? (
              <p className="text-sm text-foreground/70">
                No pipeline pressure data available for this filter set.
              </p>
            ) : null}
          </div>
        </Card>
      </div>

      <Card
        title="Pressure Anomaly Flags"
        description="Pressure anomaly list with persistent admin updates."
      >
        {anomalyTableRows.length > 0 ? (
          <Table
            headers={["Account", "Pipeline", "Pressure", "Reason", "Severity", "Action"]}
            rows={anomalyTableRows}
          />
        ) : (
          <EmptyState
            title="No anomalies for selected filters"
            description="Adjust filters to view flagged readings."
          />
        )}
      </Card>

      <Card
        title="Latest Reading Time"
        description="Most recent reading timestamp in current filter set."
      >
        <p className="text-sm text-foreground/70">
          {filteredPressureReadings[0]?.recordedAt
            ? formatDateTime(filteredPressureReadings[0].recordedAt)
            : "No readings available."}
        </p>
      </Card>
    </div>
  );
}
