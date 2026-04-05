import { NextResponse } from "next/server";
import { requireApiRoles } from "@/lib/auth/api-guards";
import { logAuditEvent } from "@/lib/audit/log";
import type { BillStatus } from "@/lib/phase9/types";

export const dynamic = "force-dynamic";

type UpdateBillBody = {
  status?: BillStatus;
};

function isBillStatus(value: unknown): value is BillStatus {
  return value === "paid" || value === "unpaid" || value === "overdue";
}

type UpdateBillRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, context: UpdateBillRouteContext) {
  const authResult = await requireApiRoles(["admin"]);

  if (!authResult.ok) {
    return authResult.response;
  }

  const { id } = await context.params;
  const billId = decodeURIComponent(id).trim();

  if (!billId) {
    return NextResponse.json({ message: "Bill id is required." }, { status: 400 });
  }

  let payload: UpdateBillBody;

  try {
    payload = (await request.json()) as UpdateBillBody;
  } catch {
    return NextResponse.json({ message: "Invalid JSON request body." }, { status: 400 });
  }

  if (!isBillStatus(payload.status)) {
    return NextResponse.json(
      { message: "Status must be paid, unpaid, or overdue." },
      { status: 400 }
    );
  }

  const { data: existingBill, error: existingBillError } = await authResult.supabase
    .from("bills")
    .select("id, status")
    .eq("id", billId)
    .maybeSingle();

  if (existingBillError) {
    return NextResponse.json({ message: existingBillError.message }, { status: 400 });
  }

  if (!existingBill) {
    return NextResponse.json({ message: "Bill not found." }, { status: 404 });
  }

  const { data: updatedBill, error: updateError } = await authResult.supabase
    .from("bills")
    .update({ status: payload.status })
    .eq("id", billId)
    .select("id, status")
    .maybeSingle();

  if (updateError) {
    return NextResponse.json({ message: updateError.message }, { status: 400 });
  }

  if (!updatedBill) {
    return NextResponse.json({ message: "Bill not found." }, { status: 404 });
  }

  await logAuditEvent(authResult.supabase, {
    entityType: "bill",
    entityId: updatedBill.id,
    actionType: "update",
    actorUserId: authResult.userId,
    oldValues: {
      status: existingBill.status,
    },
    newValues: {
      status: updatedBill.status,
    },
  });

  return NextResponse.json({
    message: "Bill status updated.",
    bill: {
      id: updatedBill.id,
      status: updatedBill.status as BillStatus,
    },
  });
}
