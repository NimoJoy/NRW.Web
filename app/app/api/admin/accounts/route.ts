import { NextResponse } from "next/server";
import { requireApiRoles } from "@/lib/auth/api-guards";
import { logAuditEvent } from "@/lib/audit/log";
import { toFiniteNumber } from "@/lib/phase9/format";
import type { AccountStatus } from "@/lib/phase9/types";

export const dynamic = "force-dynamic";

type CreateAccountBody = {
  accountNumber?: string;
  customerName?: string;
  address?: string;
  pipelineId?: string | null;
  status?: AccountStatus;
  latitude?: number | null;
  longitude?: number | null;
};

function isAccountStatus(value: unknown): value is AccountStatus {
  return value === "active" || value === "pending" || value === "suspended";
}

function parseCoordinate(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = toFiniteNumber(value, Number.NaN);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

export async function POST(request: Request) {
  const authResult = await requireApiRoles(["admin"]);

  if (!authResult.ok) {
    return authResult.response;
  }

  let payload: CreateAccountBody;

  try {
    payload = (await request.json()) as CreateAccountBody;
  } catch {
    return NextResponse.json({ message: "Invalid JSON request body." }, { status: 400 });
  }

  const accountNumber = payload.accountNumber?.trim().toUpperCase();
  const customerName = payload.customerName?.trim();
  const address = payload.address?.trim() || null;
  const pipelineId = payload.pipelineId?.trim() || null;
  const status = payload.status;
  const latitude = parseCoordinate(payload.latitude);
  const longitude = parseCoordinate(payload.longitude);

  if (!accountNumber || !customerName || !isAccountStatus(status)) {
    return NextResponse.json(
      {
        message: "accountNumber, customerName, and status (active|pending|suspended) are required.",
      },
      { status: 400 }
    );
  }

  if (latitude !== null && (Number.isNaN(latitude) || latitude < -90 || latitude > 90)) {
    return NextResponse.json({ message: "Latitude must be between -90 and 90." }, { status: 400 });
  }

  if (longitude !== null && (Number.isNaN(longitude) || longitude < -180 || longitude > 180)) {
    return NextResponse.json(
      { message: "Longitude must be between -180 and 180." },
      { status: 400 }
    );
  }

  if ((latitude === null) !== (longitude === null)) {
    return NextResponse.json(
      { message: "Latitude and longitude must be provided together." },
      { status: 400 }
    );
  }

  if (pipelineId) {
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
  }

  const { data: existingAccount, error: existingAccountError } = await authResult.supabase
    .from("accounts")
    .select("account_number")
    .eq("account_number", accountNumber)
    .maybeSingle();

  if (existingAccountError) {
    return NextResponse.json({ message: existingAccountError.message }, { status: 400 });
  }

  if (existingAccount) {
    return NextResponse.json({ message: "Account already exists." }, { status: 409 });
  }

  const { data: insertedAccount, error: insertError } = await authResult.supabase
    .from("accounts")
    .insert({
      account_number: accountNumber,
      customer_name: customerName,
      address,
      pipeline_id: pipelineId,
      status,
      latitude,
      longitude,
    })
    .select("account_number, customer_name, address, pipeline_id, status, latitude, longitude")
    .maybeSingle();

  if (insertError || !insertedAccount) {
    return NextResponse.json(
      { message: insertError?.message ?? "Unable to create account." },
      { status: 400 }
    );
  }

  await logAuditEvent(authResult.supabase, {
    entityType: "account",
    entityId: insertedAccount.account_number,
    actionType: "create",
    actorUserId: authResult.userId,
    oldValues: null,
    newValues: {
      accountNumber: insertedAccount.account_number,
      customerName: insertedAccount.customer_name,
      address: insertedAccount.address,
      pipelineId: insertedAccount.pipeline_id,
      status: insertedAccount.status,
      latitude: insertedAccount.latitude,
      longitude: insertedAccount.longitude,
    },
  });

  return NextResponse.json(
    {
      message: "Account created successfully.",
      account: {
        accountNumber: insertedAccount.account_number,
        customerName: insertedAccount.customer_name,
        address: insertedAccount.address,
        pipelineId: insertedAccount.pipeline_id,
        status: insertedAccount.status as AccountStatus,
        latitude: insertedAccount.latitude,
        longitude: insertedAccount.longitude,
      },
    },
    { status: 201 }
  );
}
