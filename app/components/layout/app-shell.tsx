import Link from "next/link";
import { LogoutButton } from "@/components/auth/logout-button";
import { type AppRole } from "@/lib/auth/types";
import { getNavigationSections } from "@/lib/mock-data/navigation";

type AppShellProps = Readonly<{
  children: React.ReactNode;
  role: AppRole;
  userEmail: string;
}>;

export function AppShell({ children, role, userEmail }: AppShellProps) {
  const navigationSections = getNavigationSections(role);
  const roleLabel = role === "admin" ? "Admin" : "Meter Reader";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-black/10 bg-background">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4">
          <h1 className="text-base font-semibold">NRW Water Billing</h1>
          <div className="flex items-center gap-3">
            <span className="rounded-md border border-black/20 px-2 py-0.5 text-xs font-medium text-foreground/80">
              {roleLabel}
            </span>
            <span className="hidden text-sm text-foreground/70 sm:inline">{userEmail}</span>
            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 md:grid-cols-[240px_1fr]">
        <aside className="border-b border-black/10 p-4 md:min-h-[calc(100vh-56px)] md:border-r md:border-b-0">
          <div className="space-y-5">
            {navigationSections.map((section) => (
              <div key={section.title} className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-foreground/50">
                  {section.title}
                </p>

                <nav className="grid grid-cols-2 gap-2 md:grid-cols-1 md:gap-1">
                  {section.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="rounded-md px-3 py-2 text-sm hover:bg-foreground/10"
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>
              </div>
            ))}
          </div>
        </aside>

        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
