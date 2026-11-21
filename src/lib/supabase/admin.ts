import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "./env";

/**
 * Cliente com a chave secreta do Supabase (ignora o RLS). Só no servidor, só para a importação.
 * Aceita o nome novo (SUPABASE_SECRET_KEY, "sb_secret_...") e o antigo (SUPABASE_SERVICE_ROLE_KEY).
 */
export function getSupabaseAdmin(): SupabaseClient | null {
  const key = (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)?.trim();
  if (!SUPABASE_URL || !key) return null;
  return createClient(SUPABASE_URL, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
