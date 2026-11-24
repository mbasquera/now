/**
 * Credenciais públicas do Supabase. Aceita o nome novo (PUBLISHABLE_KEY, "sb_publishable_...")
 * e o antigo (ANON_KEY, "eyJ..."). Referências literais para o Next embutir no navegador.
 */
export const SUPABASE_URL = normalizeUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);

/** Aceita a URL colada sem "https://" (ex.: "xxxx.supabase.co") e tira a barra do fim. */
function normalizeUrl(raw: string | undefined): string | undefined {
  const v = raw?.trim().replace(/\/+$/, "");
  if (!v) return undefined;
  return /^https?:\/\//i.test(v) ? v : `https://${v}`;
}
export const SUPABASE_KEY = (
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)?.trim();
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);
