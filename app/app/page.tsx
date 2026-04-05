import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/session";
import { getHomePathForRole } from "@/lib/auth/types";

export const dynamic = "force-dynamic";

export default async function Home() {
  const context = await getAuthContext();

  if (!context.user || !context.profile) {
    redirect("/login");
  }

  redirect(getHomePathForRole(context.profile.role));
}
