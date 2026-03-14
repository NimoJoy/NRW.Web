import Link from "next/link";

type AppLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/accounts", label: "Accounts" },
  { href: "/readings", label: "Readings" },
  { href: "/map", label: "Map" },
  { href: "/reports", label: "Reports" },
];

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-black/10 bg-background">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <h1 className="text-base font-semibold">NRW Water Billing</h1>
          <span className="text-sm text-foreground/70">Application Shell</span>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl grid-cols-1 md:grid-cols-[220px_1fr]">
        <aside className="border-b border-black/10 p-4 md:min-h-[calc(100vh-56px)] md:border-r md:border-b-0">
          <nav className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-md px-3 py-2 text-sm hover:bg-foreground/10"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}