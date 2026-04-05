import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const delimiterIndex = line.indexOf("=");
    if (delimiterIndex <= 0) {
      continue;
    }

    const key = line.slice(0, delimiterIndex).trim();
    let value = line.slice(delimiterIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function loadEnv() {
  const cwd = process.cwd();
  loadEnvFile(path.join(cwd, ".env.local"));
  loadEnvFile(path.join(cwd, ".env"));
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local or .env."
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const ORG_ID = "NRW-WATER-001";

const users = [
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

const pipelines = [
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
];

const accountSeed = [
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
];

const meterSeed = [
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
];

const readingSeed = [
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
];

const billSeed = [
  { account_number: "ACC-1001", billing_period: "2026-03-01", amount_due: 9200, status: "unpaid" },
  { account_number: "ACC-1002", billing_period: "2026-03-01", amount_due: 8500, status: "paid" },
  {
    account_number: "ACC-1003",
    billing_period: "2026-03-01",
    amount_due: 10150,
    status: "paid",
  },
  { account_number: "ACC-1004", billing_period: "2026-03-01", amount_due: 5600, status: "unpaid" },
];

async function findUserByEmail(email) {
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

async function ensureUser(userSeed) {
  const existing = await findUserByEmail(userSeed.email);

  if (existing) {
    const { error: updateError } = await supabase.auth.admin.updateUserById(existing.id, {
      app_metadata: {
        ...(existing.app_metadata ?? {}),
        role: userSeed.role,
      },
      user_metadata: {
        ...(existing.user_metadata ?? {}),
        full_name: userSeed.fullName,
        org_id: ORG_ID,
      },
    });

    if (updateError) {
      throw new Error(`Failed updating user ${userSeed.email}: ${updateError.message}`);
    }

    return existing.id;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: userSeed.email,
    password: userSeed.password,
    email_confirm: true,
    app_metadata: {
      role: userSeed.role,
    },
    user_metadata: {
      full_name: userSeed.fullName,
      org_id: ORG_ID,
    },
  });

  if (error || !data.user) {
    throw new Error(`Failed creating user ${userSeed.email}: ${error?.message ?? "Unknown error"}`);
  }

  return data.user.id;
}

async function ensureProfiles(userRows) {
  const payload = userRows.map((userRow) => ({
    user_id: userRow.userId,
    role: userRow.role,
    full_name: userRow.fullName,
    org_id: ORG_ID,
  }));

  const { error } = await supabase.from("profiles").upsert(payload, {
    onConflict: "user_id",
    ignoreDuplicates: false,
  });

  if (error) {
    throw new Error(`Failed upserting profiles: ${error.message}`);
  }
}

async function ensurePipelines() {
  const { error: upsertError } = await supabase.from("pipelines").upsert(pipelines, {
    onConflict: "name",
    ignoreDuplicates: false,
  });

  if (upsertError) {
    throw new Error(`Failed upserting pipelines: ${upsertError.message}`);
  }

  const pipelineNames = pipelines.map((pipeline) => pipeline.name);
  const { data, error } = await supabase
    .from("pipelines")
    .select("id, name")
    .in("name", pipelineNames);

  if (error || !data) {
    throw new Error(`Failed fetching pipelines after upsert: ${error?.message ?? "No data"}`);
  }

  return new Map(data.map((row) => [row.name, row.id]));
}

async function ensureAccounts(pipelineIdByName) {
  const payload = accountSeed.map((account) => ({
    account_number: account.account_number,
    customer_name: account.customer_name,
    address: account.address,
    latitude: account.latitude,
    longitude: account.longitude,
    status: account.status,
    pipeline_id: pipelineIdByName.get(account.pipelineName) ?? null,
  }));

  const { error } = await supabase.from("accounts").upsert(payload, {
    onConflict: "account_number",
    ignoreDuplicates: false,
  });

  if (error) {
    throw new Error(`Failed upserting accounts: ${error.message}`);
  }
}

async function ensureMeters() {
  const { error } = await supabase.from("meters").upsert(meterSeed, {
    onConflict: "meter_number",
    ignoreDuplicates: false,
  });

  if (error) {
    throw new Error(`Failed upserting meters: ${error.message}`);
  }

  const accountNumbers = meterSeed.map((meter) => meter.account_number);
  const { data, error: meterError } = await supabase
    .from("meters")
    .select("id, account_number")
    .in("account_number", accountNumbers);

  if (meterError || !data) {
    throw new Error(`Failed loading meters: ${meterError?.message ?? "No data"}`);
  }

  const meterByAccount = new Map();
  for (const row of data) {
    if (!meterByAccount.has(row.account_number)) {
      meterByAccount.set(row.account_number, row.id);
    }
  }

  return meterByAccount;
}

async function ensureReadings(readerUserId, meterByAccount) {
  for (const row of readingSeed) {
    const { data: existing, error: lookupError } = await supabase
      .from("readings")
      .select("id")
      .eq("account_number", row.account_number)
      .eq("recorded_at", row.recorded_at)
      .limit(1)
      .maybeSingle();

    if (lookupError) {
      throw new Error(`Failed checking reading for ${row.account_number}: ${lookupError.message}`);
    }

    if (existing) {
      continue;
    }

    const { error: insertError } = await supabase.from("readings").insert({
      meter_id: meterByAccount.get(row.account_number) ?? null,
      account_number: row.account_number,
      previous_reading: row.previous_reading,
      current_reading: row.current_reading,
      pressure: row.pressure,
      reader_id: readerUserId,
      recorded_at: row.recorded_at,
      is_anomaly: row.pressure < 35 || row.pressure > 80,
      anomaly_reason:
        row.pressure < 35 || row.pressure > 80 ? "Pressure outside baseline range" : null,
    });

    if (insertError) {
      throw new Error(`Failed inserting reading for ${row.account_number}: ${insertError.message}`);
    }
  }
}

async function ensureBills() {
  const { error } = await supabase.from("bills").upsert(billSeed, {
    onConflict: "account_number,billing_period",
    ignoreDuplicates: false,
  });

  if (error) {
    throw new Error(`Failed upserting bills: ${error.message}`);
  }
}

async function getCount(tableName) {
  const { count, error } = await supabase
    .from(tableName)
    .select("*", { count: "exact", head: true });
  if (error) {
    throw new Error(`Failed counting ${tableName}: ${error.message}`);
  }

  return count ?? 0;
}

async function run() {
  const userRows = [];
  for (const user of users) {
    const userId = await ensureUser(user);
    userRows.push({ userId, role: user.role, fullName: user.fullName });
  }

  await ensureProfiles(userRows);

  const pipelineIdByName = await ensurePipelines();
  await ensureAccounts(pipelineIdByName);

  const meterByAccount = await ensureMeters();

  const reader = userRows.find((row) => row.role === "meter_reader");
  if (!reader) {
    throw new Error("Meter reader user was not provisioned.");
  }

  await ensureReadings(reader.userId, meterByAccount);
  await ensureBills();

  const counts = {
    profiles: await getCount("profiles"),
    pipelines: await getCount("pipelines"),
    accounts: await getCount("accounts"),
    meters: await getCount("meters"),
    readings: await getCount("readings"),
    bills: await getCount("bills"),
  };

  console.log("Phase B seed complete.");
  console.table(counts);
  console.log(`Seed org_id: ${ORG_ID}`);
  console.log(`Admin user: ${users[0].email}`);
  console.log(`Meter reader user: ${users[1].email}`);
}

run().catch((error) => {
  console.error("Phase B seed failed:", error.message);
  process.exit(1);
});
