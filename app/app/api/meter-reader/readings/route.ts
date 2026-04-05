import { NextResponse } from "next/server";
import { requireApiRoles } from "@/lib/auth/api-guards";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function parseNumber(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function POST(request: Request) {
  const authResult = await requireApiRoles(["meter_reader", "admin"]);

  if (!authResult.ok) {
    return authResult.response;
  }

  const formData = await request.formData();

  const accountNumberValue = formData.get("accountNumber");
  const accountNumber =
    typeof accountNumberValue === "string" ? accountNumberValue.trim().toUpperCase() : "";

  const currentReadingNumber = parseNumber(formData.get("currentReading"));
  const fallbackPreviousReading = parseNumber(formData.get("previousReading"));
  const photo = formData.get("photo");

  if (!accountNumber) {
    return NextResponse.json({ message: "Account number is required." }, { status: 400 });
  }

  if (currentReadingNumber === null) {
    return NextResponse.json({ message: "Current reading must be a number." }, { status: 400 });
  }

  if (!(photo instanceof File) || photo.size === 0) {
    return NextResponse.json({ message: "Meter photo file is required." }, { status: 400 });
  }

  if (!photo.type.startsWith("image/")) {
    return NextResponse.json(
      { message: "Only image uploads are allowed for meter photos." },
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

  const adminSupabase = createSupabaseAdminClient();

  const [meterResult, latestReadingResult] = await Promise.all([
    adminSupabase
      .from("meters")
      .select("id")
      .eq("account_number", accountNumber)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    adminSupabase
      .from("readings")
      .select("current_reading")
      .eq("account_number", accountNumber)
      .order("recorded_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (meterResult.error) {
    return NextResponse.json({ message: meterResult.error.message }, { status: 400 });
  }

  if (latestReadingResult.error) {
    return NextResponse.json({ message: latestReadingResult.error.message }, { status: 400 });
  }

  const previousReadingNumber = Number(
    latestReadingResult.data?.current_reading ?? fallbackPreviousReading ?? 0
  );

  if (currentReadingNumber < previousReadingNumber) {
    return NextResponse.json(
      { message: "Current reading cannot be less than the latest previous reading." },
      { status: 400 }
    );
  }

  const fileExtension = photo.name.includes(".")
    ? (photo.name.split(".").pop()?.toLowerCase() ?? "jpg")
    : "jpg";
  const photoPath = `${authResult.userId}/${accountNumber}/${Date.now()}-${crypto.randomUUID()}.${fileExtension}`;

  const { error: uploadError } = await authResult.supabase.storage
    .from("meter-photos")
    .upload(photoPath, photo, {
      cacheControl: "3600",
      upsert: false,
      contentType: photo.type,
    });

  if (uploadError) {
    return NextResponse.json({ message: uploadError.message }, { status: 400 });
  }

  const { data: insertedReading, error: insertError } = await authResult.supabase
    .from("readings")
    .insert({
      meter_id: meterResult.data?.id ?? null,
      account_number: accountNumber,
      previous_reading: previousReadingNumber,
      current_reading: currentReadingNumber,
      photo_path: photoPath,
      reader_id: authResult.userId,
    })
    .select(
      "id, account_number, previous_reading, current_reading, consumption, photo_path, recorded_at"
    )
    .maybeSingle();

  if (insertError) {
    await authResult.supabase.storage.from("meter-photos").remove([photoPath]);
    return NextResponse.json({ message: insertError.message }, { status: 400 });
  }

  return NextResponse.json({
    id: insertedReading?.id,
    accountNumber: insertedReading?.account_number,
    previousReading: Number(insertedReading?.previous_reading ?? previousReadingNumber),
    currentReading: Number(insertedReading?.current_reading ?? currentReadingNumber),
    consumption: Number(
      insertedReading?.consumption ?? currentReadingNumber - previousReadingNumber
    ),
    photoPath: insertedReading?.photo_path ?? photoPath,
    recordedAt: insertedReading?.recorded_at ?? new Date().toISOString(),
    message: "Reading submitted successfully.",
  });
}
