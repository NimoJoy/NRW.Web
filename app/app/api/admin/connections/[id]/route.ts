import { NextResponse } from "next/server";
import { requireApiRoles } from "@/lib/auth/api-guards";
import { logAuditEvent } from "@/lib/audit/log";
import { toFiniteNumber } from "@/lib/phase9/format";
import type { ConnectionStatus } from "@/lib/phase9/types";

export const dynamic = "force-dynamic";

type UpdateConnectionBody = {
  pipelineId?: string;
  latitude?: number;
  longitude?: number;
  status?: ConnectionStatus;
  notes?: string;
};

type UpdateConnectionRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function isConnectionStatus(value: unknown): value is ConnectionStatus {
  return value === "active" || value === "planned" || value === "inactive";
}

function isValidLatitude(value: number) {
  return Number.isFinite(value) && value >= -90 && value <= 90;
}

function isValidLongitude(value: number) {
  return Number.isFinite(value) && value >= -180 && value <= 180;
}

export async function PATCH(request: Request, context: UpdateConnectionRouteContext) {
  const authResult = await requireApiRoles(["admin"]);

  if (!authResult.ok) {
    return authResult.response;
  }

  const { id } = await context.params;
  const connectionId = decodeURIComponent(id).trim();

  if (!connectionId) {
    return NextResponse.json({ message: "Connection id is required." }, { status: 400 });
  }

  let payload: UpdateConnectionBody;

  try {
    payload = (await request.json()) as UpdateConnectionBody;
  } catch {
    return NextResponse.json({ message: "Invalid JSON request body." }, { status: 400 });
  }

  const updates: {
    pipeline_id?: string;
    latitude?: number;
    longitude?: number;
    status?: ConnectionStatus;
    notes?: string | null;
    updated_by: string;
  } = {
    updated_by: authResult.userId,
  };

  if (payload.pipelineId !== undefined) {
    const pipelineId = payload.pipelineId.trim();

    if (!pipelineId) {
      return NextResponse.json({ message: "pipelineId cannot be empty." }, { status: 400 });
    }

    const { data: pipeline, error: pipelineError } = await authResult.supabase
      .from("pipelines")
      .select("id")
      .eq("id", pipelineId)
      .maybeSingle();

    if (pipelineError) {
      return NextResponse.json({ message: pipelineError.message }, { status: 400 });
    }

    if (!pipeline) {
      return NextResponse.json({ message: "Pipeline not found." }, { status: 404 });
    }

    updates.pipeline_id = pipelineId;
  }

  if (payload.latitude !== undefined) {
    const latitude = toFiniteNumber(payload.latitude, Number.NaN);

    if (!isValidLatitude(latitude)) {
      return NextResponse.json(
        { message: "Latitude must be between -90 and 90." },
        { status: 400 }
      );
    }

    updates.latitude = latitude;
  }

  if (payload.longitude !== undefined) {
    const longitude = toFiniteNumber(payload.longitude, Number.NaN);

    if (!isValidLongitude(longitude)) {
      return NextResponse.json(
        { message: "Longitude must be between -180 and 180." },
        { status: 400 }
      );
    }

    updates.longitude = longitude;
  }

  if (payload.status !== undefined) {
    if (!isConnectionStatus(payload.status)) {
      return NextResponse.json(
        { message: "Status must be active, planned, or inactive." },
        { status: 400 }
      );
    }

    updates.status = payload.status;
  }

  if (payload.notes !== undefined) {
    const normalizedNotes = payload.notes.trim();
    updates.notes = normalizedNotes.length > 0 ? normalizedNotes : null;
  }

  if (Object.keys(updates).length === 1) {
    return NextResponse.json(
      {
        message:
          "At least one field is required: pipelineId, latitude, longitude, status, or notes.",
      },
      { status: 400 }
    );
  }

  const { data: existingConnection, error: existingConnectionError } = await authResult.supabase
    .from("connections")
    .select("id, pipeline_id, latitude, longitude, status, notes")
    .eq("id", connectionId)
    .maybeSingle();

  if (existingConnectionError) {
    return NextResponse.json({ message: existingConnectionError.message }, { status: 400 });
  }

  if (!existingConnection) {
    return NextResponse.json({ message: "Connection not found." }, { status: 404 });
  }

  const { data: updatedConnection, error: updateError } = await authResult.supabase
    .from("connections")
    .update(updates)
    .eq("id", connectionId)
    .select("id, account_number, pipeline_id, latitude, longitude, status, notes, updated_at")
    .maybeSingle();

  if (updateError) {
    return NextResponse.json({ message: updateError.message }, { status: 400 });
  }

  if (!updatedConnection) {
    return NextResponse.json({ message: "Connection not found." }, { status: 404 });
  }

  await logAuditEvent(authResult.supabase, {
    entityType: "connection",
    entityId: updatedConnection.id,
    actionType: "update",
    actorUserId: authResult.userId,
    oldValues: {
      pipelineId: existingConnection.pipeline_id,
      latitude: existingConnection.latitude,
      longitude: existingConnection.longitude,
      status: existingConnection.status,
      notes: existingConnection.notes,
    },
    newValues: {
      pipelineId: updatedConnection.pipeline_id,
      latitude: updatedConnection.latitude,
      longitude: updatedConnection.longitude,
      status: updatedConnection.status,
      notes: updatedConnection.notes,
    },
  });

  const [accountResult, pipelineResult] = await Promise.all([
    authResult.supabase
      .from("accounts")
      .select("customer_name")
      .eq("account_number", updatedConnection.account_number)
      .maybeSingle(),
    authResult.supabase
      .from("pipelines")
      .select("name")
      .eq("id", updatedConnection.pipeline_id)
      .maybeSingle(),
  ]);

  if (accountResult.error) {
    return NextResponse.json({ message: accountResult.error.message }, { status: 400 });
  }

  if (pipelineResult.error) {
    return NextResponse.json({ message: pipelineResult.error.message }, { status: 400 });
  }

  return NextResponse.json({
    message: "Connection updated successfully.",
    connection: {
      id: updatedConnection.id,
      accountNumber: updatedConnection.account_number,
      customerName: accountResult.data?.customer_name ?? updatedConnection.account_number,
      pipelineId: updatedConnection.pipeline_id,
      pipelineName: pipelineResult.data?.name ?? "Unknown Pipeline",
      latitude: toFiniteNumber(updatedConnection.latitude),
      longitude: toFiniteNumber(updatedConnection.longitude),
      status: updatedConnection.status as ConnectionStatus,
      notes: updatedConnection.notes,
      updatedAt: updatedConnection.updated_at,
    },
  });
}
