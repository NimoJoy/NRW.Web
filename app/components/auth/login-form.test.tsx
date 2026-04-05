import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LoginForm } from "@/components/auth/login-form";

const mocks = vi.hoisted(() => ({
  routerReplace: vi.fn(),
  routerRefresh: vi.fn(),
  getSupabasePublicEnv: vi.fn(),
  signInWithPassword: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mocks.routerReplace,
    refresh: mocks.routerRefresh,
  }),
}));

vi.mock("@/lib/supabase/env", () => ({
  getSupabasePublicEnv: mocks.getSupabasePublicEnv,
}));

vi.mock("@/lib/supabase/client", () => ({
  createSupabaseBrowserClient: () => ({
    auth: {
      signInWithPassword: mocks.signInWithPassword,
    },
  }),
}));

describe("LoginForm", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    mocks.routerReplace.mockReset();
    mocks.routerRefresh.mockReset();
    mocks.getSupabasePublicEnv.mockReset();
    mocks.signInWithPassword.mockReset();
  });

  it("enforces company-first two-step login", () => {
    render(<LoginForm />);

    expect(screen.getByLabelText(/Water Company/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Email/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Change company" })).toBeInTheDocument();
  });

  it("binds selected company context after successful sign in", async () => {
    mocks.getSupabasePublicEnv.mockReturnValue({
      url: "https://example.supabase.co",
      anonKey: "anon-key",
    });
    mocks.signInWithPassword.mockResolvedValue({ error: null });

    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({}),
    } as Response);

    render(<LoginForm />);

    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: "admin@nrw.local" },
    });
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: "password-123" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => {
      expect(mocks.signInWithPassword).toHaveBeenCalledWith({
        email: "admin@nrw.local",
        password: "password-123",
      });
    });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/auth/company-context",
        expect.objectContaining({ method: "POST" })
      );
    });

    const body = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(body.companyId).toBe("NRW-WATER-001");

    expect(mocks.routerReplace).toHaveBeenCalledWith("/");
    expect(mocks.routerRefresh).toHaveBeenCalled();
  });
});
