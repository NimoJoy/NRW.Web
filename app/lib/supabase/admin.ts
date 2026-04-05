import { createClient } from "@supabase/supabase-js";
import { getRequiredSupabasePublicEnv, getRequiredSupabaseServiceEnv } from "@/lib/supabase/env";

export function createSupabaseAdminClient() {
  const { url } = getRequiredSupabasePublicEnv();
  const { serviceRoleKey } = getRequiredSupabaseServiceEnv();

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
