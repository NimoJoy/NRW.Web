import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import {
  companyContextCookieName,
  getHomePathForRole,
  isAppRole,
  isSupportedCompanyId,
  type AppRole,
  type SupportedCompanyId,
  type UserProfile,
} from "@/lib/auth/types";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function roleFromMetadata(user: User): AppRole | null {
  const metadataRole = user.app_metadata?.role;
  return isAppRole(metadataRole) ? metadataRole : null;
}

export async function getOrCreateUserProfile(user: User): Promise<UserProfile> {
  const supabase = await createSupabaseServerClient();
  const metadataRole = roleFromMetadata(user);
  const fallbackRole: AppRole = metadataRole ?? "meter_reader";
  const metadataOrgId =
    typeof user.user_metadata?.org_id === "string" ? user.user_metadata.org_id : null;

  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("user_id, role, org_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingProfile && isAppRole(existingProfile.role)) {
    if (
      (metadataRole && existingProfile.role !== metadataRole) ||
      (metadataOrgId && existingProfile.org_id !== metadataOrgId)
    ) {
      const { data: updatedProfile } = await supabase
        .from("profiles")
        .update({
          role: metadataRole ?? existingProfile.role,
          org_id: metadataOrgId ?? existingProfile.org_id,
        })
        .eq("user_id", user.id)
        .select("user_id, role, org_id")
        .maybeSingle();

      if (updatedProfile && isAppRole(updatedProfile.role)) {
        return {
          userId: updatedProfile.user_id,
          role: updatedProfile.role,
          orgId: updatedProfile.org_id,
        };
      }
    }

    return {
      userId: existingProfile.user_id,
      role: existingProfile.role,
      orgId: existingProfile.org_id,
    };
  }

  const { data: insertedProfile } = await supabase
    .from("profiles")
    .insert({ user_id: user.id, role: fallbackRole, org_id: metadataOrgId })
    .select("user_id, role, org_id")
    .maybeSingle();

  if (insertedProfile && isAppRole(insertedProfile.role)) {
    return {
      userId: insertedProfile.user_id,
      role: insertedProfile.role,
      orgId: insertedProfile.org_id,
    };
  }

  const { data: reloadedProfile } = await supabase
    .from("profiles")
    .select("user_id, role, org_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (reloadedProfile && isAppRole(reloadedProfile.role)) {
    return {
      userId: reloadedProfile.user_id,
      role: reloadedProfile.role,
      orgId: reloadedProfile.org_id,
    };
  }

  return { userId: user.id, role: fallbackRole, orgId: metadataOrgId };
}

type AuthContext = { user: null; profile: null } | { user: User; profile: UserProfile };

export const getAuthContext = cache(async (): Promise<AuthContext> => {
  const env = getSupabasePublicEnv();

  if (!env) {
    return { user: null, profile: null };
  }

  let user: User | null = null;

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user: sessionUser },
    } = await supabase.auth.getUser();
    user = sessionUser;
  } catch {
    // If Supabase is unreachable (DNS/network outage), treat as unauthenticated.
    // This prevents repeated unhandled auth fetch errors from breaking route rendering.
    return { user: null, profile: null };
  }

  if (!user) {
    return { user: null, profile: null };
  }

  const profile = await getOrCreateUserProfile(user);
  return { user, profile };
});

export async function requireUserSession() {
  const context = await getAuthContext();

  if (!context.user || !context.profile) {
    redirect("/login");
  }

  const companyContext = await getCompanyContextFromCookie();

  if (!companyContext || context.profile.orgId !== companyContext) {
    redirect("/login?reason=company-context-required");
  }

  return context;
}

export async function requireRole(role: AppRole) {
  const context = await requireUserSession();

  if (context.profile.role !== role) {
    redirect(`/login?reason=role-mismatch`);
  }

  return context;
}

export async function redirectIfAuthenticated() {
  const context = await getAuthContext();

  if (context.user && context.profile) {
    const companyContext = await getCompanyContextFromCookie();

    if (companyContext && context.profile.orgId === companyContext) {
      redirect(getHomePathForRole(context.profile.role));
    }
  }
}

export async function getCompanyContextFromCookie(): Promise<SupportedCompanyId | null> {
  const cookieStore = await cookies();
  const companyCookie = cookieStore.get(companyContextCookieName)?.value ?? null;

  if (!companyCookie || !isSupportedCompanyId(companyCookie)) {
    return null;
  }

  return companyCookie;
}
