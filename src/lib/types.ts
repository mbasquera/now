export type City = {
  slug: string;
  name: string;
  uf: string;
  timezone: string;
};

export type Sport = {
  slug: string;
  name: string;
  emoji: string;
  /** Cor de destaque do esporte (ícone, faixas). */
  color: string;
};

export type EventStatus = "pending" | "approved" | "rejected";

export type SportEvent = {
  id: string;
  title: string;
  sportSlug: string;
  citySlug: string;
  venueName: string;
  address: string;
  mapsUrl: string | null;
  startsAt: string; // ISO (UTC)
  endsAt: string; // ISO (UTC)
  isFree: boolean;
  priceCents: number | null;
  ticketUrl: string | null;
  description: string;
  imageUrl: string | null;
  organizerName: string;
  organizerInstagram: string | null;
  organizerWhatsapp: string | null;
  status: EventStatus;
  source?: string; // "manual" (organizador) ou "api-sports" (importado)
  sourceUrl?: string | null; // onde conferir a informação
  /** Confronto entre dois times (jogos importados). Escudos vêm da fonte, quando ela informa. */
  home?: Team | null;
  away?: Team | null;
  leagueLogo?: string | null;
};

export type Team = { name: string; logo: string | null };

/** Status calculado na hora a partir do início/fim. */
export type LiveState = "live" | "soon" | "later_today" | "upcoming" | "ended";
