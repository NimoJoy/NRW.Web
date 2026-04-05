import { NextResponse } from "next/server";
import { requireApiRoles } from "@/lib/auth/api-guards";
import { toFiniteNumber } from "@/lib/phase9/format";

export const dynamic = "force-dynamic";

type CreatePressureReadingBody = {
  accountNumber?: string;
  pressurePsi?: number;
  recordedAt?: string;
  notes?: string;
};

function isPressureAnomaly(pressurePsi: number) {
  return pressurePsi <= 25 || pressurePsi >= 85;
}

export async function POST(request: Request) {
  const authResult = await requireApiRoles(["meter_reader", "admin"]);

  if (!authResult.ok) {
    return authResult.response;
  }

  let payload: CreatePressureReadingBody;

  try {
    payload = (await request.json()) as CreatePressureReadingBody;
  } catch {
    return NextResponse.json({ message: "Invalid JSON request body." }, { status: 400 });
  }

  const accountNumber = payload.accountNumber?.trim().toUpperCase();
  const pressurePsi = toFiniteNumber(payload.pressurePsi, Number.NaN);
  const notes = payload.notes?.trim() ?? null;
  const recordedAt = payload.recordedAt?.trim() ?? null;

  if (!accountNumber || !Number.isFinite(pressurePsi) || pressurePsi <= 0) {
    return NextResponse.json(
      {
        message: "accountNumber and pressurePsi (> 0) are required.",
      },
      { status: 400 }
    );
  }

  const normalizedRecordedAt = recordedAt ? new Date(recordedAt).toISOString() : null;

  if (recordedAt && Number.isNaN(new Date(recordedAt).getTime())) {
    return NextResponse.json(
      { message: "recordedAt must be a valid datetime if provided." },
      { status: 400 }
    );
  }

  const [accountResult, connectionResult] = await Promise.all([
    authResult.supabase
      .from("accounts")
      .select("account_number, customer_name")
      .eq("account_number", accountNumber)
      .maybeSingle(),
    authResult.supabase
      .from("connections")
      .select("id, account_number, pipeline_id")
      .eq("account_number", accountNumber)
      .maybeSingle(),
  ]);

  if (accountResult.error) {
    return NextResponse.json({ message: accountResult.error.message }, { status: 400 });
  }

  if (connectionResult.error) {
    return NextResponse.json({ message: connectionResult.error.message }, { status: 400 });
  }

  if (!accountResult.data) {
    return NextResponse.json({ message: "Account not found." }, { status: 404 });
  }

  if (!connectionResult.data) {
    return NextResponse.json(
      { message: "No mapped connection found for this account." },
      { status: 404 }
    );
  }

  const flaggedAnomaly = isPressureAnomaly(pressurePsi);

  const { data: insertedPressureReading, error: insertError } = await authResult.supabase
    .from("pressure_readings")
    .insert({
      connection_id: connectionResult.data.id,
      account_number: accountNumber,
      pipeline_id: connectionResult.data.pipeline_id,
      pressure_value: pressurePsi,
      pressure_unit: "psi",
      reader_id: authResult.userId,
      recorded_at: normalizedRecordedAt ?? undefined,
      is_anomaly: flaggedAnomaly,
      anomaly_reason: flaggedAnomaly ? "Pressure outside baseline range (25-85 psi)." : null,
      notes,
    })
    .select(
      "id, account_number, pressure_value, pressure_unit, recorded_at, is_anomaly, anomaly_reason, notes"
    )
    .maybeSingle();

  if (insertError) {
    return NextResponse.json({ message: insertError.message }, { status: 400 });
  }

  return NextResponse.json(
    {
      message: "Pressure reading submitted successfully.",
      pressureReading: {
        id: insertedPressureReading?.id,
        accountNumber: insertedPressureReading?.account_number ?? accountNumber,
        pressurePsi: toFiniteNumber(insertedPressureReading?.pressure_value, pressurePsi),
        pressureUnit: insertedPressureReading?.pressure_unit ?? "psi",
        recordedAt: insertedPressureReading?.recorded_at ?? new Date().toISOString(),
        isAnomaly: insertedPressureReading?.is_anomaly ?? flaggedAnomaly,
        anomalyReason: insertedPressureReading?.anomaly_reason ?? null,
        notes: insertedPressureReading?.notes ?? notes,
      },
    },
    { status: 201 }
  );
}
