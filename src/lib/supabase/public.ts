import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { SUPABASE_KEY, SUPABASE_URL, isSupabaseConfigured } from "./env";

export { isSupabaseConfigured };

let client: SupabaseClient | null = null;

/** Cliente público (somente leitura de eventos aprovados, via RLS). */
export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  client ??= createClient(SUPABASE_URL!, SUPABASE_KEY!, { auth: { persistSession: false } });
  return client;
}
