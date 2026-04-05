"use server";

import { cookies } from "next/headers";
import { requireRole, requireUserSession } from "@/lib/auth/session";
import { companyContextCookieName } from "@/lib/auth/types";
import type { AppRole } from "@/lib/auth/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function logoutAction() {
  await requireUserSession();

  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  const cookieStore = await cookies();
  cookieStore.delete(companyContextCookieName);
}

export async function validateRoleServerAction(role: AppRole) {
  await requireRole(role);
  return { ok: true };
}
