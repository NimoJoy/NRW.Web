import { NextResponse } from "next/server";
import { requireApiRoles } from "@/lib/auth/api-guards";

export const dynamic = "force-dynamic";

type UpdatePressureAnomalyBody = {
  isAnomaly?: boolean;
  anomalyReason?: string | null;
};

type UpdatePressureAnomalyRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, context: UpdatePressureAnomalyRouteContext) {
  const authResult = await requireApiRoles(["admin"]);

  if (!authResult.ok) {
    return authResult.response;
  }

  const { id } = await context.params;
  const pressureReadingId = decodeURIComponent(id).trim();

  if (!pressureReadingId) {
    return NextResponse.json({ message: "Pressure reading id is required." }, { status: 400 });
  }

  let payload: UpdatePressureAnomalyBody;

  try {
    payload = (await request.json()) as UpdatePressureAnomalyBody;
  } catch {
    return NextResponse.json({ message: "Invalid JSON request body." }, { status: 400 });
  }

  if (typeof payload.isAnomaly !== "boolean") {
    return NextResponse.json({ message: "isAnomaly boolean is required." }, { status: 400 });
  }

  const anomalyReason = payload.isAnomaly
    ? payload.anomalyReason?.trim() || "Flagged by admin"
    : null;

  const { data: updatedReading, error: updateError } = await authResult.supabase
    .from("pressure_readings")
    .update({
      is_anomaly: payload.isAnomaly,
      anomaly_reason: anomalyReason,
      validated_by: authResult.userId,
      validated_at: new Date().toISOString(),
    })
    .eq("id", pressureReadingId)
    .select("id, is_anomaly, anomaly_reason, validated_by, validated_at")
    .maybeSingle();

  if (updateError) {
    return NextResponse.json({ message: updateError.message }, { status: 400 });
  }

  if (!updatedReading) {
    return NextResponse.json({ message: "Pressure reading not found." }, { status: 404 });
  }

  return NextResponse.json({
    message: payload.isAnomaly
      ? "Pressure reading flagged as anomaly."
      : "Pressure anomaly cleared.",
    pressureReading: {
      id: updatedReading.id,
      isAnomaly: updatedReading.is_anomaly,
      anomalyReason: updatedReading.anomaly_reason,
      validatedBy: updatedReading.validated_by,
      validatedAt: updatedReading.validated_at,
    },
  });
}
