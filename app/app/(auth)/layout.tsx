import { ThemeToggle } from "@/components/theme/theme-toggle";

type AuthLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(88,188,255,0.18),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(11,132,216,0.16),transparent_28%)]" />

      <div className="relative w-full max-w-lg space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[color:var(--muted)]">
              NRW Water Billing
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">Secure utility access</h1>
          </div>

          <ThemeToggle />
        </div>

        <p className="max-w-md text-sm leading-6 text-[color:var(--muted)]">
          Designed for water-company operations teams handling customer accounts, billing,
          pressure surveillance, and field submissions.
        </p>

        <div className="w-full">{children}</div>
      </div>
    </div>
  );
}
