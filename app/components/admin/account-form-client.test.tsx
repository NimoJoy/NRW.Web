import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AccountFormClient } from "@/components/admin/account-form-client";

const mocks = vi.hoisted(() => ({
  routerRefresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: mocks.routerRefresh,
  }),
}));

const baseInitialValues = {
  accountNumber: "",
  customerName: "",
  address: "",
  pipelineId: "",
  status: "active" as const,
  latitude: "",
  longitude: "",
};

describe("AccountFormClient", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    mocks.routerRefresh.mockReset();
  });

  it("validates coordinate pair requirement", async () => {
    render(
      <AccountFormClient mode="create" pipelineOptions={[]} initialValues={baseInitialValues} />
    );

    fireEvent.change(screen.getByLabelText(/Account Number/i), {
      target: { value: "acc-9001" },
    });
    fireEvent.change(screen.getByLabelText(/Customer Name/i), {
      target: { value: "New Customer" },
    });
    fireEvent.change(screen.getByLabelText(/Latitude/i), {
      target: { value: "6.50" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Create Account" }));

    expect(
      await screen.findByText("Latitude and longitude must be provided together.")
    ).toBeInTheDocument();
  });

  it("submits account create and account edit payloads", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: "Account created successfully." }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: "Account updated successfully." }),
      } as Response);

    const onSuccess = vi.fn();

    const { rerender } = render(
      <AccountFormClient
        mode="create"
        pipelineOptions={[{ id: "pipe-1", name: "North Main" }]}
        initialValues={baseInitialValues}
        onSuccess={onSuccess}
      />
    );

    fireEvent.change(screen.getByLabelText(/Account Number/i), {
      target: { value: "acc-2002" },
    });
    fireEvent.change(screen.getByLabelText(/Customer Name/i), {
      target: { value: "Amina Yusuf" },
    });
    fireEvent.change(screen.getByLabelText(/Pipeline/i), {
      target: { value: "pipe-1" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Create Account" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/admin/accounts",
        expect.objectContaining({ method: "POST" })
      );
    });

    const createBody = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(createBody.accountNumber).toBe("ACC-2002");
    expect(onSuccess).toHaveBeenCalledWith("Account created successfully.");

    rerender(
      <AccountFormClient
        mode="edit"
        pipelineOptions={[{ id: "pipe-1", name: "North Main" }]}
        accountNumberForEdit="ACC-2002"
        initialValues={{
          ...baseInitialValues,
          customerName: "Amina Yusuf",
          status: "pending",
          pipelineId: "pipe-1",
        }}
      />
    );

    fireEvent.change(screen.getByLabelText(/Customer Name/i), {
      target: { value: "Amina Yusuf Updated" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Save Account Changes" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/admin/accounts/ACC-2002",
        expect.objectContaining({ method: "PATCH" })
      );
    });
    expect(mocks.routerRefresh).toHaveBeenCalled();
  });
});
