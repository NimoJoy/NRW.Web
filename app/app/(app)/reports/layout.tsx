import { requireRole } from "@/lib/auth/session";

type ReportsLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default async function ReportsLayout({ children }: ReportsLayoutProps) {
  await requireRole("admin");
  return children;
}
