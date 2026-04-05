import { NextResponse } from "next/server";
import { requireApiRoles } from "@/lib/auth/api-guards";
import { formatBillingPeriod, formatCurrency, toFiniteNumber } from "@/lib/phase9/format";
import type { BillStatus } from "@/lib/phase9/types";

export const dynamic = "force-dynamic";

type CreateBillBody = {
  accountNumber?: string;
  billingPeriod?: string;
  amountDue?: number;
  status?: BillStatus;
};

function isBillStatus(value: unknown): value is BillStatus {
  return value === "paid" || value === "unpaid" || value === "overdue";
}

function normalizeBillingDate(value: string) {
  if (!/^\d{4}-\d{2}$/.test(value)) {
    return null;
  }

  return `${value}-01`;
}

export async function POST(request: Request) {
  const authResult = await requireApiRoles(["admin"]);

  if (!authResult.ok) {
    return authResult.response;
  }

  let payload: CreateBillBody;

  try {
    payload = (await request.json()) as CreateBillBody;
  } catch {
    return NextResponse.json({ message: "Invalid JSON request body." }, { status: 400 });
  }

  const accountNumber = payload.accountNumber?.trim().toUpperCase();
  const billingPeriod = payload.billingPeriod?.trim();
  const amountDue = toFiniteNumber(payload.amountDue, Number.NaN);
  const status = payload.status;

  if (
    !accountNumber ||
    !billingPeriod ||
    !Number.isFinite(amountDue) ||
    amountDue < 0 ||
    !isBillStatus(status)
  ) {
    return NextResponse.json(
      {
        message:
          "accountNumber, billingPeriod (YYYY-MM), amountDue (>= 0), and status (paid|unpaid|overdue) are required.",
      },
      { status: 400 }
    );
  }

  const normalizedBillingDate = normalizeBillingDate(billingPeriod);

  if (!normalizedBillingDate) {
    return NextResponse.json(
      { message: "Billing period must be in YYYY-MM format." },
      { status: 400 }
    );
  }

  const { data: account, error: accountError } = await authResult.supabase
    .from("accounts")
    .select("account_number")
    .eq("account_number", accountNumber)
    .maybeSingle();

  if (accountError) {
    return NextResponse.json({ message: accountError.message }, { status: 400 });
  }

  if (!account) {
    return NextResponse.json({ message: "Account not found." }, { status: 404 });
  }

  const { data: insertedBill, error: insertError } = await authResult.supabase
    .from("bills")
    .insert({
      account_number: accountNumber,
      billing_period: normalizedBillingDate,
      amount_due: amountDue,
      status,
    })
    .select("id, account_number, billing_period, amount_due, status")
    .maybeSingle();

  if (insertError) {
    return NextResponse.json({ message: insertError.message }, { status: 400 });
  }

  return NextResponse.json(
    {
      message: "Bill created successfully.",
      bill: {
        id: insertedBill?.id,
        accountNumber: insertedBill?.account_number,
        billingPeriod: formatBillingPeriod(insertedBill?.billing_period ?? billingPeriod),
        amountDue: formatCurrency(insertedBill?.amount_due ?? amountDue),
        rawAmountDue: toFiniteNumber(insertedBill?.amount_due, amountDue),
        status: (insertedBill?.status as BillStatus) ?? status,
      },
    },
    { status: 201 }
  );
}
