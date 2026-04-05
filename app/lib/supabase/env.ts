export type SupabasePublicEnv = {
  url: string;
  anonKey: string;
};

export type SupabaseServiceEnv = {
  serviceRoleKey: string;
};

export function getSupabasePublicEnv(): SupabasePublicEnv | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  return { url, anonKey };
}

export function getRequiredSupabasePublicEnv(): SupabasePublicEnv {
  const env = getSupabasePublicEnv();

  if (!env) {
    throw new Error(
      "Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  return env;
}

export function getSupabaseServiceEnv(): SupabaseServiceEnv | null {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    return null;
  }

  return { serviceRoleKey };
}

export function getRequiredSupabaseServiceEnv(): SupabaseServiceEnv {
  const env = getSupabaseServiceEnv();

  if (!env) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY in environment variables.");
  }

  return env;
}
