import { getMockEvents } from "./mock-data";
import { getSupabase } from "./supabase/public";
import type { SportEvent } from "./types";

const LOOKAHEAD_DAYS = 7;

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
  sport: { slug: string } | null;
  city: { slug: string } | null;
  organizer: { name: string; instagram: string | null; whatsapp: string | null } | null;
};

const SELECT = `
  id, title, venue_name, address, maps_url, starts_at, ends_at, is_free, price_cents,
  ticket_url, description, image_url, status,
  sport:sports(slug), city:cities!inner(slug),
  organizer:organizers(name, instagram, whatsapp)
`;

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
  };
}

export type DataProblem = { hint: string; detail: string };

/** Traduz erros comuns de configuração do Supabase em uma dica para o dono do site. */
function explain(error: { message?: string; code?: string; details?: string }): DataProblem {
  const msg = `${error.message ?? ""} ${error.details ?? ""}`;
  const code = error.code ?? "";
  let hint = "Não foi possível ler os eventos do banco.";
  if (code === "PGRST205" || code === "42P01" || /does not exist|could not find the table/i.test(msg))
    hint = "As tabelas não existem no Supabase. Rode supabase/migrations/0001_init.sql e depois supabase/seed.sql no SQL Editor.";
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
    return getMockEvents(now)
      .filter((e) => e.citySlug === citySlug && new Date(e.endsAt) > now && new Date(e.startsAt) < limit)
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  }

  const { data, error } = await supabase
    .from("events")
    .select(SELECT)
    .eq("status", "approved")
    .eq("city.slug", citySlug)
    .gt("ends_at", now.toISOString())
    .lt("starts_at", limit.toISOString())
    .order("starts_at");
  if (error) throw error;
  return (data as unknown as EventRow[]).map(fromRow);
}

export async function getEvent(id: string): Promise<SportEvent | null> {
  const supabase = getSupabase();
  if (supabase && !/^[0-9a-f-]{36}$/i.test(id)) return null;
  if (!supabase) return getMockEvents().find((e) => e.id === id) ?? null;

  try {
    const { data, error } = await supabase
      .from("events")
      .select(SELECT)
      .eq("id", id)
      .eq("status", "approved")
      .maybeSingle();
    if (error) throw error;
    return data ? fromRow(data as unknown as EventRow) : null;
  } catch (e) {
    console.error("[NOW] erro ao carregar evento:", e);
    return null;
  }
}
