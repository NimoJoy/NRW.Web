import { NextResponse } from "next/server";
import { requireApiRoles } from "@/lib/auth/api-guards";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const ORG_ID = "NRW-WATER-001";

type SeedUser = {
  email: string;
  password: string;
  fullName: string;
  role: "admin" | "meter_reader";
};

const pipelinesSeed = [
  {
    name: "North Trunk",
    status: "active",
    geojson: {
      type: "LineString",
      coordinates: [
        [36.815, -1.245],
        [36.823, -1.238],
        [36.831, -1.232],
      ],
    },
  },
  {
    name: "East Distribution",
    status: "maintenance",
    geojson: {
      type: "LineString",
      coordinates: [
        [36.821, -1.248],
        [36.829, -1.244],
        [36.838, -1.241],
      ],
    },
  },
] as const;

const accountsSeed = [
  {
    account_number: "ACC-1001",
    customer_name: "Amina Otieno",
    address: "Plot 12, River Road",
    latitude: -1.2378,
    longitude: 36.8243,
    status: "active",
    pipelineName: "North Trunk",
  },
  {
    account_number: "ACC-1002",
    customer_name: "Peter Mwangi",
    address: "Block B, Sunrise Estate",
    latitude: -1.2412,
    longitude: 36.8299,
    status: "active",
    pipelineName: "North Trunk",
  },
  {
    account_number: "ACC-1003",
    customer_name: "Grace Njeri",
    address: "House 45, Green Park",
    latitude: -1.2441,
    longitude: 36.8347,
    status: "pending",
    pipelineName: "East Distribution",
  },
  {
    account_number: "ACC-1004",
    customer_name: "Samuel Kibet",
    address: "23 Valley View",
    latitude: -1.2476,
    longitude: 36.8391,
    status: "suspended",
    pipelineName: "East Distribution",
  },
] as const;

const metersSeed = [
  {
    account_number: "ACC-1001",
    meter_number: "MTR-9001",
    install_date: "2025-07-12",
    status: "active",
  },
  {
    account_number: "ACC-1002",
    meter_number: "MTR-9002",
    install_date: "2025-08-05",
    status: "active",
  },
  {
    account_number: "ACC-1003",
    meter_number: "MTR-9003",
    install_date: "2025-09-01",
    status: "maintenance",
  },
  {
    account_number: "ACC-1004",
    meter_number: "MTR-9004",
    install_date: "2025-10-22",
    status: "active",
  },
] as const;

const readingsSeed = [
  {
    account_number: "ACC-1001",
    previous_reading: 1200,
    current_reading: 1265,
    pressure: 54,
    recorded_at: "2026-03-01T08:00:00.000Z",
  },
  {
    account_number: "ACC-1002",
    previous_reading: 980,
    current_reading: 1040,
    pressure: 58,
    recorded_at: "2026-03-02T08:15:00.000Z",
  },
  {
    account_number: "ACC-1003",
    previous_reading: 1445,
    current_reading: 1490,
    pressure: 33,
    recorded_at: "2026-03-03T08:25:00.000Z",
  },
  {
    account_number: "ACC-1004",
    previous_reading: 1670,
    current_reading: 1700,
    pressure: 81,
    recorded_at: "2026-03-03T08:40:00.000Z",
  },
] as const;

const billsSeed = [
  { account_number: "ACC-1001", billing_period: "2026-03-01", amount_due: 9200, status: "unpaid" },
  { account_number: "ACC-1002", billing_period: "2026-03-01", amount_due: 8500, status: "paid" },
  {
    account_number: "ACC-1003",
    billing_period: "2026-03-01",
    amount_due: 10150,
    status: "paid",
  },
  { account_number: "ACC-1004", billing_period: "2026-03-01", amount_due: 5600, status: "unpaid" },
] as const;

type SupabaseAdmin = ReturnType<typeof createSupabaseAdminClient>;

async function findUserByEmail(supabase: SupabaseAdmin, email: string) {
  let page = 1;
  const perPage = 200;

  while (page <= 20) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) {
      throw new Error(`Failed listing users: ${error.message}`);
    }

    const match = data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
    if (match) {
      return match;
    }

    if (data.users.length < perPage) {
      break;
    }

    page += 1;
  }

  return null;
}

async function ensureUser(supabase: SupabaseAdmin, seedUser: SeedUser) {
  const existing = await findUserByEmail(supabase, seedUser.email);

  if (existing) {
    const { error } = await supabase.auth.admin.updateUserById(existing.id, {
      app_metadata: {
        ...(existing.app_metadata ?? {}),
        role: seedUser.role,
      },
      user_metadata: {
        ...(existing.user_metadata ?? {}),
        full_name: seedUser.fullName,
        org_id: ORG_ID,
      },
    });

    if (error) {
      throw new Error(`Failed updating user ${seedUser.email}: ${error.message}`);
    }

    return existing.id;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: seedUser.email,
    password: seedUser.password,
    email_confirm: true,
    app_metadata: {
      role: seedUser.role,
    },
    user_metadata: {
      full_name: seedUser.fullName,
      org_id: ORG_ID,
    },
  });

  if (error || !data.user) {
    throw new Error(`Failed creating user ${seedUser.email}: ${error?.message ?? "Unknown error"}`);
  }

  return data.user.id;
}

async function getCount(supabase: SupabaseAdmin, table: string) {
  const { count, error } = await supabase.from(table).select("*", { count: "exact", head: true });
  if (error) {
    throw new Error(`Failed counting ${table}: ${error.message}`);
  }

  return count ?? 0;
}

export async function POST(request: Request) {
  const authResult = await requireApiRoles(["admin"]);

  if (!authResult.ok) {
    return authResult.response;
  }

  const token = request.headers.get("x-bootstrap-token");
  const expectedToken = process.env.PHASE_B_BOOTSTRAP_TOKEN;

  if (!expectedToken) {
    return NextResponse.json(
      { message: "PHASE_B_BOOTSTRAP_TOKEN is not configured." },
      { status: 503 }
    );
  }

  if (!token || token !== expectedToken) {
    return NextResponse.json({ message: "Invalid bootstrap token." }, { status: 403 });
  }

  const supabase = createSupabaseAdminClient();

  try {
    const usersSeed: SeedUser[] = [
      {
        email: process.env.SEED_ADMIN_EMAIL ?? "admin@nrw-water.local",
        password: process.env.SEED_ADMIN_PASSWORD ?? "Admin#12345",
        fullName: "James Kinaga",
        role: "admin",
      },
      {
        email: process.env.SEED_ADMIN2_EMAIL ?? "admin2@nrw-water.local",
        password: process.env.SEED_ADMIN2_PASSWORD ?? "Admin#12345",
        fullName: "Joy Wanyoike",
        role: "admin",
      },
      {
        email: process.env.SEED_READER_EMAIL ?? "reader@nrw-water.local",
        password: process.env.SEED_READER_PASSWORD ?? "Reader#12345",
        fullName: "Shaleen Kiragu",
        role: "meter_reader",
      },
      {
        email: process.env.SEED_READER2_EMAIL ?? "reader2@nrw-water.local",
        password: process.env.SEED_READER2_PASSWORD ?? "Reader#12345",
        fullName: "Rock Ngugi",
        role: "meter_reader",
      },
    ];

    const provisionedUsers = await Promise.all(
      usersSeed.map(async (seedUser) => ({
        userId: await ensureUser(supabase, seedUser),
        role: seedUser.role,
        fullName: seedUser.fullName,
      }))
    );

    const { error: profileError } = await supabase.from("profiles").upsert(
      provisionedUsers.map((user) => ({
        user_id: user.userId,
        role: user.role,
        full_name: user.fullName,
        org_id: ORG_ID,
      })),
      { onConflict: "user_id", ignoreDuplicates: false }
    );

    if (profileError) {
      throw new Error(`Failed upserting profiles: ${profileError.message}`);
    }

    const { error: pipelineError } = await supabase.from("pipelines").upsert(pipelinesSeed, {
      onConflict: "name",
      ignoreDuplicates: false,
    });

    if (pipelineError) {
      throw new Error(`Failed upserting pipelines: ${pipelineError.message}`);
    }

    const { data: pipelineRows, error: pipelineLookupError } = await supabase
      .from("pipelines")
      .select("id, name")
      .in(
        "name",
        pipelinesSeed.map((pipeline) => pipeline.name)
      );

    if (pipelineLookupError || !pipelineRows) {
      throw new Error(
        `Failed loading pipelines: ${pipelineLookupError?.message ?? "No pipeline rows returned"}`
      );
    }

    const pipelineIdByName = new Map(pipelineRows.map((row) => [row.name, row.id]));

    const { error: accountError } = await supabase.from("accounts").upsert(
      accountsSeed.map((account) => ({
        account_number: account.account_number,
        customer_name: account.customer_name,
        address: account.address,
        latitude: account.latitude,
        longitude: account.longitude,
        status: account.status,
        pipeline_id: pipelineIdByName.get(account.pipelineName) ?? null,
      })),
      { onConflict: "account_number", ignoreDuplicates: false }
    );

    if (accountError) {
      throw new Error(`Failed upserting accounts: ${accountError.message}`);
    }

    const { error: meterError } = await supabase.from("meters").upsert(metersSeed, {
      onConflict: "meter_number",
      ignoreDuplicates: false,
    });

    if (meterError) {
      throw new Error(`Failed upserting meters: ${meterError.message}`);
    }

    const { data: meterRows, error: meterLookupError } = await supabase
      .from("meters")
      .select("id, account_number")
      .in(
        "account_number",
        metersSeed.map((meter) => meter.account_number)
      );

    if (meterLookupError || !meterRows) {
      throw new Error(`Failed loading meters: ${meterLookupError?.message ?? "No meter rows"}`);
    }

    const meterByAccount = new Map<string, string>();
    meterRows.forEach((row) => {
      if (!meterByAccount.has(row.account_number)) {
        meterByAccount.set(row.account_number, row.id);
      }
    });

    const reader = provisionedUsers.find((user) => user.role === "meter_reader");
    if (!reader) {
      throw new Error("Meter reader seed user not provisioned.");
    }

    for (const reading of readingsSeed) {
      const { data: existingReading, error: readingLookupError } = await supabase
        .from("readings")
        .select("id")
        .eq("account_number", reading.account_number)
        .eq("recorded_at", reading.recorded_at)
        .limit(1)
        .maybeSingle();

      if (readingLookupError) {
        throw new Error(`Failed checking readings: ${readingLookupError.message}`);
      }

      if (!existingReading) {
        const isAnomaly = reading.pressure < 35 || reading.pressure > 80;
        const { error: readingInsertError } = await supabase.from("readings").insert({
          meter_id: meterByAccount.get(reading.account_number) ?? null,
          account_number: reading.account_number,
          previous_reading: reading.previous_reading,
          current_reading: reading.current_reading,
          pressure: reading.pressure,
          reader_id: reader.userId,
          recorded_at: reading.recorded_at,
          is_anomaly: isAnomaly,
          anomaly_reason: isAnomaly ? "Pressure outside baseline range" : null,
        });

        if (readingInsertError) {
          throw new Error(`Failed inserting reading: ${readingInsertError.message}`);
        }
      }
    }

    const { error: billError } = await supabase.from("bills").upsert(billsSeed, {
      onConflict: "account_number,billing_period",
      ignoreDuplicates: false,
    });

    if (billError) {
      throw new Error(`Failed upserting bills: ${billError.message}`);
    }

    const counts = {
      profiles: await getCount(supabase, "profiles"),
      pipelines: await getCount(supabase, "pipelines"),
      accounts: await getCount(supabase, "accounts"),
      meters: await getCount(supabase, "meters"),
      readings: await getCount(supabase, "readings"),
      bills: await getCount(supabase, "bills"),
    };

    return NextResponse.json({
      message: "Phase B bootstrap seed completed.",
      orgId: ORG_ID,
      credentials: {
        adminEmail: usersSeed[0].email,
        readerEmail: usersSeed[1].email,
      },
      counts,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Bootstrap failed.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
