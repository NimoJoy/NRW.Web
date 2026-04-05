import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SubmitReadingClient } from "@/components/meter-reader/submit-reading-client";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

describe("SubmitReadingClient", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("submits a reading and applies a correction", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "reading-1",
          accountNumber: "ACC-1001",
          previousReading: 120,
          currentReading: 130,
          consumption: 10,
          photoPath: "meter-photos/reading-1.jpg",
          recordedAt: "2026-03-22T12:00:00.000Z",
          message: "Reading submitted successfully.",
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: "Reading correction saved.",
          reading: {
            id: "reading-1",
            accountNumber: "ACC-1001",
            previousReading: 120,
            currentReading: 135,
            consumption: 15,
            recordedAt: "2026-03-22T12:05:00.000Z",
          },
        }),
      } as Response);

    render(<SubmitReadingClient />);

    fireEvent.change(screen.getByLabelText(/Account Number/i), {
      target: { value: "acc-1001" },
    });
    fireEvent.change(screen.getByLabelText(/Previous Reading/i), {
      target: { value: "120" },
    });
    fireEvent.change(screen.getByLabelText(/Current Reading/i), {
      target: { value: "130" },
    });

    const file = new File(["image-bytes"], "meter.jpg", { type: "image/jpeg" });
    const meterPhotoInput = screen.getByLabelText(/Meter Photo/i) as HTMLInputElement;
    Object.defineProperty(meterPhotoInput, "files", {
      value: [file],
      writable: false,
    });
    fireEvent.change(meterPhotoInput);

    const saveButton = screen.getByRole("button", { name: "Save Reading" });
    const readingForm = saveButton.closest("form");

    if (!readingForm) {
      throw new Error("Reading form not found.");
    }

    fireEvent.submit(readingForm);

    expect(await screen.findByText("Reading submitted successfully.")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Corrected Current Reading/i), {
      target: { value: "135" },
    });
    fireEvent.change(screen.getByLabelText(/Correction Reason/i), {
      target: { value: "digit misread" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Apply Correction" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/meter-reader/readings/reading-1/correction",
        expect.objectContaining({ method: "PATCH" })
      );
    });

    expect(await screen.findByText("Reading correction saved.")).toBeInTheDocument();
  });
});
