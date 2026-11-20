/**
 * Credenciais públicas do Supabase. Aceita o nome novo (PUBLISHABLE_KEY, "sb_publishable_...")
 * e o antigo (ANON_KEY, "eyJ..."). Referências literais para o Next embutir no navegador.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/+$/, "");
export const SUPABASE_KEY = (
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)?.trim();
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);
