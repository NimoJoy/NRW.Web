import { requireRole } from "@/lib/auth/session";

type MapLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default async function MapLayout({ children }: MapLayoutProps) {
  await requireRole("admin");
  return children;
}
