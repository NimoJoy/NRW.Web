import { requireRole } from "@/lib/auth/session";

type DashboardLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  await requireRole("admin");
  return children;
}
