import { NextResponse } from "next/server";
import { requireApiRoles } from "@/lib/auth/api-guards";
import { logAuditEvent } from "@/lib/audit/log";
import { toFiniteNumber } from "@/lib/phase9/format";
import type { AccountStatus } from "@/lib/phase9/types";

export const dynamic = "force-dynamic";

type UpdateAccountBody = {
  customerName?: string;
  address?: string | null;
  pipelineId?: string | null;
  status?: AccountStatus;
  latitude?: number | null;
  longitude?: number | null;
};

type UpdateAccountRouteContext = {
  params: Promise<{
    accountNumber: string;
  }>;
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

export async function PATCH(request: Request, context: UpdateAccountRouteContext) {
  const authResult = await requireApiRoles(["admin"]);

  if (!authResult.ok) {
    return authResult.response;
  }

  const { accountNumber } = await context.params;
  const normalizedAccountNumber = decodeURIComponent(accountNumber).trim().toUpperCase();

  if (!normalizedAccountNumber) {
    return NextResponse.json({ message: "Account number is required." }, { status: 400 });
  }

  let payload: UpdateAccountBody;

  try {
    payload = (await request.json()) as UpdateAccountBody;
  } catch {
    return NextResponse.json({ message: "Invalid JSON request body." }, { status: 400 });
  }

  const { data: existingAccount, error: existingAccountError } = await authResult.supabase
    .from("accounts")
    .select("account_number, customer_name, address, pipeline_id, status, latitude, longitude")
    .eq("account_number", normalizedAccountNumber)
    .maybeSingle();

  if (existingAccountError) {
    return NextResponse.json({ message: existingAccountError.message }, { status: 400 });
  }

  if (!existingAccount) {
    return NextResponse.json({ message: "Account not found." }, { status: 404 });
  }

  const updates: {
    customer_name?: string;
    address?: string | null;
    pipeline_id?: string | null;
    status?: AccountStatus;
    latitude?: number | null;
    longitude?: number | null;
  } = {};

  if (payload.customerName !== undefined) {
    const customerName = payload.customerName.trim();
    if (!customerName) {
      return NextResponse.json({ message: "customerName cannot be empty." }, { status: 400 });
    }

    updates.customer_name = customerName;
  }

  if (payload.address !== undefined) {
    updates.address = payload.address?.trim() || null;
  }

  if (payload.pipelineId !== undefined) {
    const pipelineId = payload.pipelineId?.trim() || null;

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

    updates.pipeline_id = pipelineId;
  }

  if (payload.status !== undefined) {
    if (!isAccountStatus(payload.status)) {
      return NextResponse.json(
        { message: "status must be active, pending, or suspended." },
        { status: 400 }
      );
    }

    updates.status = payload.status;
  }

  if (payload.latitude !== undefined || payload.longitude !== undefined) {
    const latitude =
      payload.latitude !== undefined ? parseCoordinate(payload.latitude) : existingAccount.latitude;
    const longitude =
      payload.longitude !== undefined
        ? parseCoordinate(payload.longitude)
        : existingAccount.longitude;

    if (
      latitude !== null &&
      (Number.isNaN(Number(latitude)) || Number(latitude) < -90 || Number(latitude) > 90)
    ) {
      return NextResponse.json(
        { message: "Latitude must be between -90 and 90." },
        { status: 400 }
      );
    }

    if (
      longitude !== null &&
      (Number.isNaN(Number(longitude)) || Number(longitude) < -180 || Number(longitude) > 180)
    ) {
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

    updates.latitude = latitude;
    updates.longitude = longitude;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ message: "No account changes provided." }, { status: 400 });
  }

  const { data: updatedAccount, error: updateError } = await authResult.supabase
    .from("accounts")
    .update(updates)
    .eq("account_number", normalizedAccountNumber)
    .select("account_number, customer_name, address, pipeline_id, status, latitude, longitude")
    .maybeSingle();

  if (updateError || !updatedAccount) {
    return NextResponse.json(
      { message: updateError?.message ?? "Unable to update account." },
      { status: 400 }
    );
  }

  await logAuditEvent(authResult.supabase, {
    entityType: "account",
    entityId: updatedAccount.account_number,
    actionType: "update",
    actorUserId: authResult.userId,
    oldValues: {
      customerName: existingAccount.customer_name,
      address: existingAccount.address,
      pipelineId: existingAccount.pipeline_id,
      status: existingAccount.status,
      latitude: existingAccount.latitude,
      longitude: existingAccount.longitude,
    },
    newValues: {
      customerName: updatedAccount.customer_name,
      address: updatedAccount.address,
      pipelineId: updatedAccount.pipeline_id,
      status: updatedAccount.status,
      latitude: updatedAccount.latitude,
      longitude: updatedAccount.longitude,
    },
  });

  return NextResponse.json({
    message: "Account updated successfully.",
    account: {
      accountNumber: updatedAccount.account_number,
      customerName: updatedAccount.customer_name,
      address: updatedAccount.address,
      pipelineId: updatedAccount.pipeline_id,
      status: updatedAccount.status as AccountStatus,
      latitude: updatedAccount.latitude,
      longitude: updatedAccount.longitude,
    },
  });
}
