import { NextResponse } from "next/server";
import { requireApiRoles } from "@/lib/auth/api-guards";
import { logAuditEvent } from "@/lib/audit/log";
import { toFiniteNumber } from "@/lib/phase9/format";

export const dynamic = "force-dynamic";

const CORRECTION_WINDOW_HOURS = 24;

type ReadingCorrectionBody = {
  currentReading?: number;
  reason?: string;
};

type ReadingCorrectionRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, context: ReadingCorrectionRouteContext) {
  const authResult = await requireApiRoles(["meter_reader", "admin"]);

  if (!authResult.ok) {
    return authResult.response;
  }

  const { id } = await context.params;
  const readingId = decodeURIComponent(id).trim();

  if (!readingId) {
    return NextResponse.json({ message: "Reading id is required." }, { status: 400 });
  }

  let payload: ReadingCorrectionBody;

  try {
    payload = (await request.json()) as ReadingCorrectionBody;
  } catch {
    return NextResponse.json({ message: "Invalid JSON request body." }, { status: 400 });
  }

  const correctedReading = toFiniteNumber(payload.currentReading, Number.NaN);
  const correctionReason = payload.reason?.trim();

  if (!Number.isFinite(correctedReading)) {
    return NextResponse.json(
      { message: "currentReading must be a valid number." },
      { status: 400 }
    );
  }

  if (!correctionReason) {
    return NextResponse.json({ message: "Correction reason is required." }, { status: 400 });
  }

  const { data: existingReading, error: existingReadingError } = await authResult.supabase
    .from("readings")
    .select(
      "id, account_number, previous_reading, current_reading, consumption, reader_id, recorded_at"
    )
    .eq("id", readingId)
    .maybeSingle();

  if (existingReadingError) {
    return NextResponse.json({ message: existingReadingError.message }, { status: 400 });
  }

  if (!existingReading) {
    return NextResponse.json({ message: "Reading not found." }, { status: 404 });
  }

  if (authResult.role === "meter_reader") {
    if (existingReading.reader_id !== authResult.userId) {
      return NextResponse.json(
        { message: "You can only correct readings that you submitted." },
        { status: 403 }
      );
    }

    const recordedAtTimestamp = new Date(existingReading.recorded_at).getTime();
    const allowedUntil = recordedAtTimestamp + CORRECTION_WINDOW_HOURS * 60 * 60 * 1000;

    if (Date.now() > allowedUntil) {
      return NextResponse.json(
        { message: `Correction window exceeded (${CORRECTION_WINDOW_HOURS} hours).` },
        { status: 403 }
      );
    }
  }

  if (correctedReading < Number(existingReading.previous_reading)) {
    return NextResponse.json(
      { message: "Corrected reading cannot be below previous reading." },
      { status: 400 }
    );
  }

  const { data: updatedReading, error: updateError } = await authResult.supabase
    .from("readings")
    .update({
      current_reading: correctedReading,
    })
    .eq("id", readingId)
    .select(
      "id, account_number, previous_reading, current_reading, consumption, reader_id, recorded_at"
    )
    .maybeSingle();

  if (updateError || !updatedReading) {
    return NextResponse.json(
      { message: updateError?.message ?? "Unable to correct reading." },
      { status: 400 }
    );
  }

  await logAuditEvent(authResult.supabase, {
    entityType: "reading",
    entityId: updatedReading.id,
    actionType: "correction",
    actorUserId: authResult.userId,
    oldValues: {
      accountNumber: existingReading.account_number,
      currentReading: existingReading.current_reading,
      previousReading: existingReading.previous_reading,
      consumption: existingReading.consumption,
    },
    newValues: {
      accountNumber: updatedReading.account_number,
      currentReading: updatedReading.current_reading,
      previousReading: updatedReading.previous_reading,
      consumption: updatedReading.consumption,
      reason: correctionReason,
    },
  });

  return NextResponse.json({
    message: "Reading correction saved.",
    reading: {
      id: updatedReading.id,
      accountNumber: updatedReading.account_number,
      previousReading: Number(updatedReading.previous_reading),
      currentReading: Number(updatedReading.current_reading),
      consumption: Number(updatedReading.consumption),
      recordedAt: updatedReading.recorded_at,
      correctionWindowHours: CORRECTION_WINDOW_HOURS,
    },
  });
}
