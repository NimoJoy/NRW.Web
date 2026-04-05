import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SubmitPressureClient } from "@/components/meter-reader/submit-pressure-client";

describe("SubmitPressureClient", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("validates pressure and submits pressure stream payload", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        message: "Pressure reading submitted successfully.",
        pressureReading: {
          id: "pressure-2",
          accountNumber: "ACC-3003",
          pressurePsi: 62,
          pressureUnit: "psi",
          recordedAt: "2026-03-22T12:00:00.000Z",
          isAnomaly: false,
          anomalyReason: null,
          notes: "normal",
        },
      }),
    } as Response);

    render(<SubmitPressureClient />);

    fireEvent.change(screen.getByLabelText(/Account Number/i), {
      target: { value: "acc-3003" },
    });
    fireEvent.change(screen.getByLabelText(/Pressure \(psi\)/i), {
      target: { value: "-1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save Pressure Reading" }));
    expect(await screen.findByText("Pressure must be a positive number.")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Pressure \(psi\)/i), {
      target: { value: "62" },
    });
    fireEvent.change(screen.getByLabelText(/Notes/i), {
      target: { value: "normal" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Save Pressure Reading" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/meter-reader/pressure-readings",
        expect.objectContaining({ method: "POST" })
      );
    });
    expect(await screen.findByText("Pressure reading submitted successfully.")).toBeInTheDocument();
  });
});
