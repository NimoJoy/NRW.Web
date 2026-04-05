import { NextResponse } from "next/server";
import { requireApiRoles } from "@/lib/auth/api-guards";

export const dynamic = "force-dynamic";

type UpdateAnomalyBody = {
  isAnomaly?: boolean;
  anomalyReason?: string | null;
};

type UpdateAnomalyRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, context: UpdateAnomalyRouteContext) {
  const authResult = await requireApiRoles(["admin"]);

  if (!authResult.ok) {
    return authResult.response;
  }

  const { id } = await context.params;
  const readingId = decodeURIComponent(id).trim();

  if (!readingId) {
    return NextResponse.json({ message: "Reading id is required." }, { status: 400 });
  }

  let payload: UpdateAnomalyBody;

  try {
    payload = (await request.json()) as UpdateAnomalyBody;
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
    .from("readings")
    .update({
      is_anomaly: payload.isAnomaly,
      anomaly_reason: anomalyReason,
    })
    .eq("id", readingId)
    .select("id, is_anomaly, anomaly_reason")
    .maybeSingle();

  if (updateError) {
    return NextResponse.json({ message: updateError.message }, { status: 400 });
  }

  if (!updatedReading) {
    return NextResponse.json({ message: "Reading not found." }, { status: 404 });
  }

  return NextResponse.json({
    message: payload.isAnomaly ? "Reading flagged as anomaly." : "Anomaly flag cleared.",
    reading: {
      id: updatedReading.id,
      isAnomaly: updatedReading.is_anomaly,
      anomalyReason: updatedReading.anomaly_reason,
    },
  });
}
