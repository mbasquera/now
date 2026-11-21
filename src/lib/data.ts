import { getMockEvents } from "./mock-data";
import { getSupabase } from "./supabase/public";
import type { SportEvent } from "./types";

const LOOKAHEAD_DAYS = 7;

// Eventos fictícios só aparecem fora do site de produção (no seu computador ou nas prévias da Vercel).
const showMockData = process.env.VERCEL_ENV !== "production";

type EventRow = {
  id: string;
  title: string;
  venue_name: string;
  address: string;
  maps_url: string | null;
  starts_at: string;
  ends_at: string;
  is_free: boolean;
  price_cents: number | null;
  ticket_url: string | null;
  description: string | null;
  image_url: string | null;
  status: SportEvent["status"];
  source: string;
  source_url: string | null;
  home_name?: string | null;
  home_logo?: string | null;
  away_name?: string | null;
  away_logo?: string | null;
  league_logo?: string | null;
  sport: { slug: string } | null;
  city: { slug: string } | null;
  organizer: { name: string; instagram: string | null; whatsapp: string | null } | null;
};

const BASE_SELECT = `
  id, title, venue_name, address, maps_url, starts_at, ends_at, is_free, price_cents,
  ticket_url, description, image_url, status, source, source_url,
  sport:sports(slug), city:cities!inner(slug),
  organizer:organizers(name, instagram, whatsapp)
`;
const TEAM_SELECT = `${BASE_SELECT}, home_name, home_logo, away_name, away_logo, league_logo`;

// Enquanto a 0011_escudos.sql não roda no banco, as colunas de escudo não existem: lê sem elas.
let teamColumns = true;
function select() {
  return teamColumns ? TEAM_SELECT : BASE_SELECT;
}
function missingTeamColumns(error: { message?: string } | null) {
  if (error && teamColumns && /home_name|home_logo|away_name|away_logo|league_logo/.test(error.message ?? "")) {
    teamColumns = false;
    return true;
  }
  return false;
}

function fromRow(r: EventRow): SportEvent {
  return {
    id: r.id,
    title: r.title,
    sportSlug: r.sport?.slug ?? "outro",
    citySlug: r.city?.slug ?? "",
    venueName: r.venue_name,
    address: r.address,
    mapsUrl: r.maps_url,
    startsAt: r.starts_at,
    endsAt: r.ends_at,
    isFree: r.is_free,
    priceCents: r.price_cents,
    ticketUrl: r.ticket_url,
    description: r.description ?? "",
    imageUrl: r.image_url,
    organizerName: r.organizer?.name ?? "Organizador",
    organizerInstagram: r.organizer?.instagram ?? null,
    organizerWhatsapp: r.organizer?.whatsapp ?? null,
    status: r.status,
    source: r.source,
    sourceUrl: r.source_url,
    home: r.home_name ? { name: r.home_name, logo: r.home_logo ?? null } : null,
    away: r.away_name ? { name: r.away_name, logo: r.away_logo ?? null } : null,
    leagueLogo: r.league_logo ?? null,
  };
}

export type DataProblem = { hint: string; detail: string };

/** Traduz erros comuns de configuração do Supabase em uma dica para o dono do site. */
function explain(error: { message?: string; code?: string; details?: string }): DataProblem {
  const msg = `${error.message ?? ""} ${error.details ?? ""}`;
  const code = error.code ?? "";
  let hint = "Não foi possível ler os eventos do banco.";
  if (code === "PGRST205" || code === "42P01" || /does not exist|could not find the table/i.test(msg))
    hint = "As tabelas não existem no Supabase. Rode supabase/migrations/0001_init.sql e depois supabase/base.sql no SQL Editor.";
  else if (code === "42501" || /permission denied/i.test(msg))
    hint = "O banco bloqueou a leitura. Rode supabase/migrations/0002_grants.sql no SQL Editor do Supabase.";
  else if (code === "PGRST200" || /relationship/i.test(msg))
    hint = "O esquema do banco está incompleto. Rode de novo o supabase/migrations/0001_init.sql inteiro.";
  else if (/invalid api key|jwt|401|no api key/i.test(msg))
    hint = "A chave do Supabase está errada. Copie a chave publishable (sb_publishable_...) do botão Connect do Supabase.";
  else if (/fetch failed|ENOTFOUND|getaddrinfo|Invalid URL/i.test(msg))
    hint = "Não deu para conectar ao Supabase. Confira NEXT_PUBLIC_SUPABASE_URL (ex.: https://xxxx.supabase.co).";
  return { hint, detail: (error.message ?? String(error)).slice(0, 300) };
}

/**
 * Eventos aprovados da cidade que ainda não terminaram (próximos 7 dias).
 * Nunca lança: se o banco falhar, devolve a lista vazia e o problema para exibir.
 */
export async function getCityEvents(
  citySlug: string,
  now = new Date(),
): Promise<{ events: SportEvent[]; problem: DataProblem | null }> {
  try {
    return { events: await fetchCityEvents(citySlug, now), problem: null };
  } catch (e) {
    console.error("[NOW] erro ao carregar eventos:", e);
    return { events: [], problem: explain(e as { message?: string }) };
  }
}

async function fetchCityEvents(citySlug: string, now: Date): Promise<SportEvent[]> {
  const limit = new Date(now.getTime() + LOOKAHEAD_DAYS * 86_400_000);
  const supabase = getSupabase();

  if (!supabase) {
    if (!showMockData) return [];
    return getMockEvents(now)
      .filter((e) => e.citySlug === citySlug && new Date(e.endsAt) > now && new Date(e.startsAt) < limit)
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  }

  const query = () =>
    supabase
      .from("events")
      .select(select())
      .eq("status", "approved")
      .eq("city.slug", citySlug)
      .gt("ends_at", now.toISOString())
      .lt("starts_at", limit.toISOString())
      .order("starts_at");
  let { data, error } = await query();
  if (missingTeamColumns(error)) ({ data, error } = await query());
  if (error) throw error;
  return (data as unknown as EventRow[]).map(fromRow);
}

export async function getEvent(id: string): Promise<SportEvent | null> {
  const supabase = getSupabase();
  if (supabase && !/^[0-9a-f-]{36}$/i.test(id)) return null;
  if (!supabase) return showMockData ? (getMockEvents().find((e) => e.id === id) ?? null) : null;

  try {
    const query = () => supabase.from("events").select(select()).eq("id", id).eq("status", "approved").maybeSingle();
    let { data, error } = await query();
    if (missingTeamColumns(error)) ({ data, error } = await query());
    if (error) throw error;
    return data ? fromRow(data as unknown as EventRow) : null;
  } catch (e) {
    console.error("[NOW] erro ao carregar evento:", e);
    return null;
  }
}

export type CityPulse = { live: number; today: number };

/**
 * Quantos eventos cada capital tem ao vivo e hoje (para a página inicial).
 * Nunca lança: em caso de erro devolve um mapa vazio e a página mostra as cidades sem números.
 */
export async function getCityPulse(now = new Date()): Promise<Map<string, CityPulse>> {
  const out = new Map<string, CityPulse>();
  const until = new Date(now.getTime() + 24 * 3_600_000);
  const add = (slug: string, startsAt: string) => {
    const p = out.get(slug) ?? { live: 0, today: 0 };
    if (new Date(startsAt) <= now) p.live++;
    else p.today++;
    out.set(slug, p);
  };
  const supabase = getSupabase();
  if (!supabase) {
    if (showMockData)
      getMockEvents(now)
        .filter((e) => new Date(e.endsAt) > now && new Date(e.startsAt) < until)
        .forEach((e) => add(e.citySlug, e.startsAt));
    return out;
  }
  try {
    const { data, error } = await supabase
      .from("events")
      .select("starts_at, city:cities!inner(slug)")
      .eq("status", "approved")
      .gt("ends_at", now.toISOString())
      .lt("starts_at", until.toISOString())
      .limit(2000);
    if (error) throw error;
    for (const r of data as unknown as { starts_at: string; city: { slug: string } | null }[])
      if (r.city) add(r.city.slug, r.starts_at);
  } catch (e) {
    console.error("[NOW] erro ao contar eventos por cidade:", e);
  }
  return out;
}
