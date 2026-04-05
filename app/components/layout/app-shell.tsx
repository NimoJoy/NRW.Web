"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/components/auth/logout-button";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { type AppRole } from "@/lib/auth/types";
import { getNavigationSections } from "@/lib/mock-data/navigation";

type AppShellProps = Readonly<{
  children: React.ReactNode;
  role: AppRole;
  userEmail: string;
}>;

export function AppShell({ children, role, userEmail }: AppShellProps) {
  const pathname = usePathname();
  const navigationSections = getNavigationSections(role);
  const roleLabel = role === "admin" ? "Admin" : "Meter Reader";

  function isActivePath(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <div className="min-h-screen text-foreground">
      <header className="sticky top-0 z-30 border-b border-[color:var(--border)] bg-[color:var(--shell-backdrop)] backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[90rem] flex-wrap items-center gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,var(--primary),var(--primary-strong))] text-sm font-extrabold tracking-[0.18em] text-[color:var(--primary-contrast)] shadow-[0_20px_40px_-24px_rgba(9,97,165,0.85)]">
              NRW
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[color:var(--muted)]">
                Water Operations Platform
              </p>
              <h1 className="text-lg font-semibold tracking-tight">NRW Water Billing</h1>
            </div>
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-3">
            <ThemeToggle />

            <div className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)] shadow-[var(--soft-shadow)]">
              {roleLabel}
            </div>

            <div className="hidden rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-2 text-sm shadow-[var(--soft-shadow)] sm:block">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                Signed In
              </p>
              <p className="truncate font-medium text-foreground">{userEmail}</p>
            </div>

            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-[90rem] grid-cols-1 gap-6 px-4 pb-8 pt-6 sm:px-6 md:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="md:sticky md:top-28 md:h-fit">
          <div className="overflow-hidden rounded-[30px] border border-[color:var(--border)] bg-[linear-gradient(180deg,var(--surface-strong),var(--surface))] p-5 shadow-[var(--card-shadow)] backdrop-blur-xl">
            <div className="mb-6 rounded-[24px] border border-[color:var(--border)] bg-[linear-gradient(145deg,var(--primary-soft),transparent_68%),var(--surface-soft)] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)]">
                Network Focus
              </p>
              <h2 className="mt-2 text-lg font-semibold tracking-tight">Operational coverage</h2>
              <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                Customer accounts, field readings, pressure monitoring, reporting, and mapping in
                one workspace.
              </p>
            </div>

            <div className="space-y-5">
            {navigationSections.map((section) => (
              <div key={section.title} className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[color:var(--muted)]">
                  {section.title}
                </p>

                <nav className="grid grid-cols-1 gap-2">
                  {section.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={isActivePath(item.href) ? "page" : undefined}
                      className={`rounded-2xl border px-3 py-3 text-sm font-medium transition ${
                        isActivePath(item.href)
                          ? "border-transparent bg-[linear-gradient(135deg,var(--primary),var(--primary-strong))] text-[color:var(--primary-contrast)] shadow-[0_18px_42px_-28px_rgba(9,97,165,0.85)]"
                          : "border-[color:var(--border)] bg-transparent text-foreground hover:border-[color:var(--border-strong)] hover:bg-[color:var(--surface-soft)]"
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>
              </div>
            ))}
            </div>
          </div>
        </aside>

        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
