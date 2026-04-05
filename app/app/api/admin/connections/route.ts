import { NextResponse } from "next/server";
import { requireApiRoles } from "@/lib/auth/api-guards";
import { toFiniteNumber } from "@/lib/phase9/format";
import type { ConnectionStatus } from "@/lib/phase9/types";

export const dynamic = "force-dynamic";

type CreateConnectionBody = {
  accountNumber?: string;
  pipelineId?: string;
  latitude?: number;
  longitude?: number;
  status?: ConnectionStatus;
  notes?: string;
};

type ConnectionRow = {
  id: string;
  account_number: string;
  pipeline_id: string;
  latitude: number | string;
  longitude: number | string;
  status: string;
  notes: string | null;
  updated_at: string;
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

export async function GET() {
  const authResult = await requireApiRoles(["admin", "meter_reader"]);

  if (!authResult.ok) {
    return authResult.response;
  }

  const { data: connections, error } = await authResult.supabase
    .from("connections")
    .select("id, account_number, pipeline_id, latitude, longitude, status, notes, updated_at")
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }

  const connectionRows = (connections ?? []) as ConnectionRow[];
  const accountNumbers = Array.from(new Set(connectionRows.map((row) => row.account_number)));
  const pipelineIds = Array.from(new Set(connectionRows.map((row) => row.pipeline_id)));

  const [accountsResult, pipelinesResult] = await Promise.all([
    accountNumbers.length > 0
      ? authResult.supabase
          .from("accounts")
          .select("account_number, customer_name")
          .in("account_number", accountNumbers)
      : Promise.resolve({ data: [], error: null }),
    pipelineIds.length > 0
      ? authResult.supabase.from("pipelines").select("id, name").in("id", pipelineIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (accountsResult.error) {
    return NextResponse.json({ message: accountsResult.error.message }, { status: 400 });
  }

  if (pipelinesResult.error) {
    return NextResponse.json({ message: pipelinesResult.error.message }, { status: 400 });
  }

  const accountNameByNumber = new Map(
    (accountsResult.data ?? []).map((account) => [account.account_number, account.customer_name])
  );
  const pipelineNameById = new Map(
    (pipelinesResult.data ?? []).map((pipeline) => [pipeline.id, pipeline.name])
  );

  return NextResponse.json({
    connections: connectionRows.map((row) => ({
      id: row.id,
      accountNumber: row.account_number,
      customerName: accountNameByNumber.get(row.account_number) ?? row.account_number,
      pipelineId: row.pipeline_id,
      pipelineName: pipelineNameById.get(row.pipeline_id) ?? "Unknown Pipeline",
      latitude: toFiniteNumber(row.latitude),
      longitude: toFiniteNumber(row.longitude),
      status: row.status as ConnectionStatus,
      notes: row.notes,
      updatedAt: row.updated_at,
    })),
  });
}

export async function POST(request: Request) {
  const authResult = await requireApiRoles(["admin"]);

  if (!authResult.ok) {
    return authResult.response;
  }

  let payload: CreateConnectionBody;

  try {
    payload = (await request.json()) as CreateConnectionBody;
  } catch {
    return NextResponse.json({ message: "Invalid JSON request body." }, { status: 400 });
  }

  const accountNumber = payload.accountNumber?.trim().toUpperCase();
  const pipelineId = payload.pipelineId?.trim();
  const latitude = toFiniteNumber(payload.latitude, Number.NaN);
  const longitude = toFiniteNumber(payload.longitude, Number.NaN);
  const status = payload.status;
  const notes = payload.notes?.trim() ?? null;

  if (!accountNumber || !pipelineId || !isConnectionStatus(status)) {
    return NextResponse.json(
      {
        message: "accountNumber, pipelineId, and status (active|planned|inactive) are required.",
      },
      { status: 400 }
    );
  }

  if (!isValidLatitude(latitude) || !isValidLongitude(longitude)) {
    return NextResponse.json(
      {
        message: "Latitude must be between -90 and 90, and longitude must be between -180 and 180.",
      },
      { status: 400 }
    );
  }

  const [accountResult, pipelineResult, existingResult] = await Promise.all([
    authResult.supabase
      .from("accounts")
      .select("account_number, customer_name")
      .eq("account_number", accountNumber)
      .maybeSingle(),
    authResult.supabase.from("pipelines").select("id, name").eq("id", pipelineId).maybeSingle(),
    authResult.supabase
      .from("connections")
      .select("id")
      .eq("account_number", accountNumber)
      .maybeSingle(),
  ]);

  if (accountResult.error) {
    return NextResponse.json({ message: accountResult.error.message }, { status: 400 });
  }

  if (pipelineResult.error) {
    return NextResponse.json({ message: pipelineResult.error.message }, { status: 400 });
  }

  if (existingResult.error) {
    return NextResponse.json({ message: existingResult.error.message }, { status: 400 });
  }

  if (!accountResult.data) {
    return NextResponse.json({ message: "Account not found." }, { status: 404 });
  }

  if (!pipelineResult.data) {
    return NextResponse.json({ message: "Pipeline not found." }, { status: 404 });
  }

  if (existingResult.data) {
    return NextResponse.json(
      { message: "A connection already exists for this account." },
      { status: 409 }
    );
  }

  const { data: insertedConnection, error: insertError } = await authResult.supabase
    .from("connections")
    .insert({
      account_number: accountNumber,
      pipeline_id: pipelineId,
      latitude,
      longitude,
      status,
      notes,
      created_by: authResult.userId,
      updated_by: authResult.userId,
    })
    .select("id, account_number, pipeline_id, latitude, longitude, status, notes, updated_at")
    .maybeSingle();

  if (insertError) {
    return NextResponse.json({ message: insertError.message }, { status: 400 });
  }

  return NextResponse.json(
    {
      message: "Connection created successfully.",
      connection: {
        id: insertedConnection?.id,
        accountNumber: insertedConnection?.account_number ?? accountNumber,
        customerName: accountResult.data.customer_name,
        pipelineId: insertedConnection?.pipeline_id ?? pipelineResult.data.id,
        pipelineName: pipelineResult.data.name,
        latitude: toFiniteNumber(insertedConnection?.latitude, latitude),
        longitude: toFiniteNumber(insertedConnection?.longitude, longitude),
        status: (insertedConnection?.status as ConnectionStatus) ?? status,
        notes: insertedConnection?.notes ?? notes,
        updatedAt: insertedConnection?.updated_at ?? new Date().toISOString(),
      },
    },
    { status: 201 }
  );
}
