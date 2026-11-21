import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "./env";

/**
 * Cliente com a chave secreta do Supabase (ignora o RLS). Só no servidor, só para a importação.
 * Aceita o nome novo (SUPABASE_SECRET_KEY, "sb_secret_...") e o antigo (SUPABASE_SERVICE_ROLE_KEY).
 */
/**
 * Detecta quando colaram a chave pública no lugar da secreta (erro comum: dá "permission denied").
 * Devolve uma mensagem de erro, ou null se a chave parece ser a secreta.
 */
export function checkSecretKey(): string | null {
  const key = (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)?.trim();
  if (!key) return null;
  const wrong =
    "A SUPABASE_SECRET_KEY na Vercel é a chave pública. Use a Secret key (sb_secret_...) do Supabase > Project Settings > API Keys e faça Redeploy.";
  if (key.startsWith("sb_publishable_")) return wrong;
  if (key.startsWith("eyJ")) {
    try {
      const payload = JSON.parse(Buffer.from(key.split(".")[1], "base64url").toString());
      if (payload.role && payload.role !== "service_role") return wrong;
    } catch {
      // formato desconhecido: deixa o Supabase responder
    }
  }
  return null;
}

export function getSupabaseAdmin(): SupabaseClient | null {
  const key = (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)?.trim();
  if (!SUPABASE_URL || !key) return null;
  return createClient(SUPABASE_URL, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
