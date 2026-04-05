import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { getCompanyContextFromCookie, getOrCreateUserProfile } from "@/lib/auth/session";
import type { AppRole } from "@/lib/auth/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type GuardResult =
  | {
      ok: true;
      supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
      userId: string;
      role: AppRole;
    }
  | {
      ok: false;
      response: NextResponse;
    };

export async function requireApiRoles(allowedRoles: AppRole[]): Promise<GuardResult> {
  let supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  let user: User | null = null;

  try {
    supabase = await createSupabaseServerClient();
    const {
      data: { user: sessionUser },
    } = await supabase.auth.getUser();
    user = sessionUser;
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { message: "Supabase is unreachable. Check NEXT_PUBLIC_SUPABASE_URL and network DNS." },
        { status: 503 }
      ),
    };
  }

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ message: "Unauthorized" }, { status: 401 }),
    };
  }

  const profile = await getOrCreateUserProfile(user);
  const companyContext = await getCompanyContextFromCookie();

  if (!companyContext || profile.orgId !== companyContext) {
    return {
      ok: false,
      response: NextResponse.json({ message: "Company context is required" }, { status: 403 }),
    };
  }

  if (!allowedRoles.includes(profile.role)) {
    return {
      ok: false,
      response: NextResponse.json({ message: "Forbidden" }, { status: 403 }),
    };
  }

  return {
    ok: true,
    supabase,
    userId: user.id,
    role: profile.role,
  };
}
