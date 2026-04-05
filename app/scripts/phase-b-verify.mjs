import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const content = fs.readFileSync(filePath, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separator = line.indexOf("=");
    if (separator <= 0) {
      continue;
    }

    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();

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

loadEnvFile(path.join(process.cwd(), ".env.local"));
loadEnvFile(path.join(process.cwd(), ".env"));

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function count(tableName) {
  const { count, error } = await supabase
    .from(tableName)
    .select("*", { count: "exact", head: true });
  if (error) {
    throw new Error(`Count failed for ${tableName}: ${error.message}`);
  }

  return count ?? 0;
}

async function verify() {
  const counts = {
    profiles: await count("profiles"),
    pipelines: await count("pipelines"),
    accounts: await count("accounts"),
    meters: await count("meters"),
    readings: await count("readings"),
    bills: await count("bills"),
  };

  const { count: mappedConnections, error: mappedError } = await supabase
    .from("accounts")
    .select("*", {
      count: "exact",
      head: true,
    })
    .not("latitude", "is", null)
    .not("longitude", "is", null);

  if (mappedError) {
    throw new Error(`Mapped-connection check failed: ${mappedError.message}`);
  }

  const thresholds = {
    profiles: 4,
    pipelines: 2,
    accounts: 4,
    meters: 4,
    readings: 4,
    bills: 4,
    mappedConnections: 4,
  };

  const checks = {
    profiles: counts.profiles >= thresholds.profiles,
    pipelines: counts.pipelines >= thresholds.pipelines,
    accounts: counts.accounts >= thresholds.accounts,
    meters: counts.meters >= thresholds.meters,
    readings: counts.readings >= thresholds.readings,
    bills: counts.bills >= thresholds.bills,
    mappedConnections: (mappedConnections ?? 0) >= thresholds.mappedConnections,
  };

  console.log("Phase B verification summary:");
  console.table({
    ...counts,
    mappedConnections: mappedConnections ?? 0,
  });

  const failing = Object.entries(checks).filter(([, passed]) => !passed);
  if (failing.length > 0) {
    console.error("Phase B verification failed:", failing.map(([name]) => name).join(", "));
    process.exit(1);
  }

  console.log("Phase B verification passed.");
}

verify().catch((error) => {
  console.error("Phase B verification failed:", error.message);
  process.exit(1);
});
