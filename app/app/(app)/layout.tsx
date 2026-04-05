import { AppShell } from "@/components/layout/app-shell";
import { requireUserSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

type AppLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default async function AppLayout({ children }: AppLayoutProps) {
  const { user, profile } = await requireUserSession();

  return (
    <AppShell role={profile.role} userEmail={user.email ?? "unknown@user.local"}>
      {children}
    </AppShell>
  );
}
