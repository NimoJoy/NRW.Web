import { requireRole } from "@/lib/auth/session";

type AdminLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default async function AdminLayout({ children }: AdminLayoutProps) {
  await requireRole("admin");
  return children;
}
