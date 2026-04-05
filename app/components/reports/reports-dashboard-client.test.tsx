import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ReportsDashboardClient } from "@/components/reports/reports-dashboard-client";
import type { ReportsDataset } from "@/lib/phase9/types";

const dataset: ReportsDataset = {
  metrics: [
    { label: "Accounts", value: "1", tone: "info" },
    { label: "Consumption Readings", value: "1", tone: "neutral" },
    { label: "Pressure Readings", value: "1", tone: "neutral" },
    { label: "Pending Bills", value: "0", tone: "warning" },
    { label: "Pressure Anomalies", value: "1", tone: "danger" },
  ],
  pipelineOptions: ["All Pipelines", "North Main"],
  readings: [
    {
      id: "consumption-1",
      accountNumber: "ACC-1001",
      pipeline: "North Main",
      consumption: 42,
      recordedAt: new Date().toISOString(),
      isAnomaly: false,
      anomalyReason: null,
    },
  ],
  pressureReadings: [
    {
      id: "pressure-1",
      accountNumber: "ACC-1001",
      pipeline: "North Main",
      pressurePsi: 85,
      recordedAt: new Date().toISOString(),
      isAnomaly: true,
      anomalyReason: "High pressure",
    },
  ],
};

describe("ReportsDashboardClient", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("persists anomaly toggle through admin API", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        message: "Anomaly flag cleared.",
        pressureReading: {
          id: "pressure-1",
          isAnomaly: false,
          anomalyReason: null,
        },
      }),
    } as Response);

    render(<ReportsDashboardClient dataset={dataset} />);

    fireEvent.click(await screen.findByRole("button", { name: "Clear" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/admin/pressure-readings/pressure-1/anomaly",
        expect.objectContaining({ method: "PATCH" })
      );
    });

    expect(await screen.findByText("Anomaly flag cleared.")).toBeInTheDocument();
  });
});
