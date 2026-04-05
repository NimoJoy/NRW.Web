import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AccountSearchClient } from "@/components/meter-reader/account-search-client";

describe("AccountSearchClient", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows validation message when account number is missing", async () => {
    render(<AccountSearchClient />);

    fireEvent.change(screen.getByLabelText("Account Number *"), {
      target: { value: "   " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Search" }));

    expect(screen.getByText("Account number is required.")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText("No account selected")).toBeInTheDocument();
    });
  });

  it("renders matched account details from API and submit link", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        accountNumber: "ACC-1001",
        customerName: "Amina Yusuf",
        pipeline: "North Main",
        status: "active",
        previousReading: 1203,
        lastPressurePsi: 54,
        lastRecordedAt: "2026-03-10T10:00:00.000Z",
      }),
    } as Response);

    render(<AccountSearchClient />);

    fireEvent.change(screen.getByLabelText("Account Number *"), {
      target: { value: "acc-1001" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Search" }));

    expect(await screen.findByText("Account Match")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/meter-reader/account-lookup?accountNumber=ACC-1001",
      expect.objectContaining({ method: "GET" })
    );

    const continueLink = screen.getByRole("link", { name: "Continue to Submit Page" });
    expect(continueLink).toHaveAttribute(
      "href",
      "/meter-reader/submit?accountNumber=ACC-1001&previousReading=1203"
    );
  });
});
