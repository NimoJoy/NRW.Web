import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BillsManagementClient } from "@/components/admin/bills-management-client";
import type { AdminBillListItem } from "@/lib/phase9/types";

const initialBills: AdminBillListItem[] = [
  {
    id: "bill-1",
    accountNumber: "ACC-1001",
    billingPeriod: "2026-02",
    amountDue: "KSh 12,000.00",
    rawAmountDue: 12000,
    status: "unpaid",
  },
];

describe("BillsManagementClient", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("creates a bill using the admin API", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        message: "Bill created successfully.",
        bill: {
          id: "bill-2",
          accountNumber: "ACC-2002",
          billingPeriod: "2026-03",
          amountDue: "KSh 9,000.00",
          rawAmountDue: 9000,
          status: "unpaid",
        },
      }),
    } as Response);

    render(<BillsManagementClient initialBills={initialBills} />);

    fireEvent.change(screen.getByLabelText("Account Number *"), {
      target: { value: "acc-2002" },
    });
    fireEvent.change(screen.getByLabelText("Billing Period *"), {
      target: { value: "2026-03" },
    });
    fireEvent.change(screen.getByLabelText("Amount Due *"), {
      target: { value: "9000" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Create Bill" }));

    expect(await screen.findByText("Bill created successfully.")).toBeInTheDocument();
    expect(screen.getByText("ACC-2002")).toBeInTheDocument();
  });

  it("updates bill status using the admin API", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        message: "Bill status updated.",
        bill: {
          id: "bill-1",
          status: "paid",
        },
      }),
    } as Response);

    render(<BillsManagementClient initialBills={initialBills} />);

    const allUnpaidSelects = screen.getAllByDisplayValue("unpaid");
    const rowStatusSelect = allUnpaidSelects[allUnpaidSelects.length - 1];

    fireEvent.change(rowStatusSelect, { target: { value: "paid" } });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/admin/bills/bill-1",
        expect.objectContaining({ method: "PATCH" })
      );
    });
  });
});
