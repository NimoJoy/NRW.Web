import { NextResponse } from "next/server";
import { getOrCreateUserProfile } from "@/lib/auth/session";
import { companyContextCookieName, isSupportedCompanyId } from "@/lib/auth/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type CompanyContextPayload = {
  companyId?: unknown;
};

export async function POST(request: Request) {
  let payload: CompanyContextPayload;

  try {
    payload = (await request.json()) as CompanyContextPayload;
  } catch {
    return NextResponse.json({ message: "Invalid request body" }, { status: 400 });
  }

  if (!isSupportedCompanyId(payload.companyId)) {
    return NextResponse.json({ message: "Invalid company selection" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const profile = await getOrCreateUserProfile(user);

  if (!profile.orgId) {
    const { data: updatedProfile, error: updateError } = await supabase
      .from("profiles")
      .update({ org_id: payload.companyId })
      .eq("user_id", user.id)
      .select("org_id")
      .maybeSingle();

    if (updateError) {
      return NextResponse.json({ message: updateError.message }, { status: 400 });
    }

    if (!updatedProfile?.org_id) {
      return NextResponse.json(
        { message: "Unable to establish company context for your account." },
        { status: 400 }
      );
    }
  }

  if (profile.orgId && profile.orgId !== payload.companyId) {
    return NextResponse.json(
      {
        message: `Company does not match your account. Your account is linked to ${profile.orgId}.`,
      },
      { status: 403 }
    );
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(companyContextCookieName, payload.companyId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  return response;
}
