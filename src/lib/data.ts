import { getMockEvents } from "./mock-data";
import { getSupabase } from "./supabase";
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

/** Eventos aprovados da cidade que ainda não terminaram (próximos 7 dias). */
export async function getCityEvents(citySlug: string, now = new Date()): Promise<SportEvent[]> {
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
  if (!supabase) return getMockEvents().find((e) => e.id === id) ?? null;

  const { data, error } = await supabase
    .from("events")
    .select(SELECT)
    .eq("id", id)
    .eq("status", "approved")
    .maybeSingle();
  if (error) {
    // id inválido (não-uuid) etc.
    return null;
  }
  return data ? fromRow(data as unknown as EventRow) : null;
}
