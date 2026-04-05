import { NextResponse } from "next/server";
import { requireApiRoles } from "@/lib/auth/api-guards";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authResult = await requireApiRoles(["meter_reader", "admin"]);

  if (!authResult.ok) {
    return authResult.response;
  }

  const { searchParams } = new URL(request.url);
  const accountNumber = searchParams.get("accountNumber")?.trim().toUpperCase();

  if (!accountNumber) {
    return NextResponse.json({ message: "Account number is required." }, { status: 400 });
  }

  const { data: account, error: accountError } = await authResult.supabase
    .from("accounts")
    .select("account_number, customer_name, status, pipeline_id")
    .eq("account_number", accountNumber)
    .maybeSingle();

  if (accountError) {
    return NextResponse.json({ message: accountError.message }, { status: 400 });
  }

  if (!account) {
    return NextResponse.json({ message: "Account not found." }, { status: 404 });
  }

  const adminSupabase = createSupabaseAdminClient();

  const [pipelineResult, latestReadingResult, latestPressureResult] = await Promise.all([
    account.pipeline_id
      ? adminSupabase.from("pipelines").select("name").eq("id", account.pipeline_id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    adminSupabase
      .from("readings")
      .select("current_reading, recorded_at")
      .eq("account_number", accountNumber)
      .order("recorded_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    adminSupabase
      .from("pressure_readings")
      .select("pressure_value")
      .eq("account_number", accountNumber)
      .order("recorded_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (pipelineResult.error) {
    return NextResponse.json({ message: pipelineResult.error.message }, { status: 400 });
  }

  if (latestReadingResult.error) {
    return NextResponse.json({ message: latestReadingResult.error.message }, { status: 400 });
  }

  if (latestPressureResult.error) {
    return NextResponse.json({ message: latestPressureResult.error.message }, { status: 400 });
  }

  const latestReading = latestReadingResult.data;
  const latestPressure = latestPressureResult.data;

  return NextResponse.json({
    accountNumber: account.account_number,
    customerName: account.customer_name,
    status: account.status,
    pipeline: pipelineResult.data?.name ?? "Unassigned",
    previousReading: Number(latestReading?.current_reading ?? 0),
    lastPressurePsi:
      latestPressure?.pressure_value !== null && latestPressure?.pressure_value !== undefined
        ? Number(latestPressure.pressure_value)
        : null,
    lastRecordedAt: latestReading?.recorded_at ?? null,
  });
}
