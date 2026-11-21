/**
 * Cliente mínimo da API-Sports (https://api-sports.io): uma chave serve para futebol, basquete e vôlei.
 * Cada esporte tem cota própria (100 consultas/dia no plano grátis); a importação gasta 1 consulta por dia buscado.
 */

export type SportKey = "futebol" | "basquete" | "volei";

const HOSTS: Record<SportKey, { base: string; path: string }> = {
  futebol: { base: "https://v3.football.api-sports.io", path: "/fixtures" },
  basquete: { base: "https://v1.basketball.api-sports.io", path: "/games" },
  volei: { base: "https://v1.volleyball.api-sports.io", path: "/games" },
};

/** Jogo já no formato comum, antes de virar evento. */
export type ExternalGame = {
  externalId: string; // "futebol:123456"
  sport: SportKey;
  startsAt: string; // ISO
  statusShort: string;
  leagueId: number;
  leagueName: string;
  round: string | null;
  home: string;
  homeId: number | null;
  homeLogo: string | null;
  away: string;
  awayLogo: string | null;
  leagueLogo: string | null;
  venueId: number | null;
  venueName: string | null;
  venueCity: string | null;
  venueFrom?: "fixture" | "home-team"; // de onde veio o local
};

type FootballFixture = {
  fixture: { id: number; date: string; status: { short: string }; venue: { id: number | null; name: string | null; city: string | null } };
  league: { id: number; name: string; country: string; round?: string; logo?: string | null };
  teams: { home: { id: number; name: string; logo?: string | null }; away: { name: string; logo?: string | null } };
};

type Game = {
  id: number;
  date: string;
  status: { short: string };
  country: { name: string };
  league: { id: number; name: string; logo?: string | null };
  week?: string | null;
  teams: { home: { name: string; logo?: string | null }; away: { name: string; logo?: string | null } };
};

type ApiResponse<T> = { errors: unknown; response: T[] };

export class ApiSportsError extends Error {}
/** A data está fora do que o plano permite (o grátis só libera de ontem até depois de amanhã). */
export class PlanLimitError extends ApiSportsError {}

function errorText(errors: unknown): string | null {
  if (!errors) return null;
  if (Array.isArray(errors)) return errors.length ? errors.join("; ") : null;
  if (typeof errors === "object") {
    const values = Object.values(errors as Record<string, unknown>);
    return values.length ? values.map(String).join("; ") : null;
  }
  return String(errors);
}

/** Jogos no Brasil numa data (AAAA-MM-DD, horário de Brasília). */
export async function fetchBrazilGames(sport: SportKey, date: string, apiKey: string): Promise<ExternalGame[]> {
  const { base, path } = HOSTS[sport];
  const url = `${base}${path}?date=${date}&timezone=America/Sao_Paulo`;
  const res = await fetch(url, { headers: { "x-apisports-key": apiKey }, cache: "no-store" });
  if (!res.ok) throw new ApiSportsError(`${sport} ${date}: HTTP ${res.status}`);
  const body = (await res.json()) as ApiResponse<unknown>;
  const err = errorText(body.errors);
  if (err && /do not have access to this (date|season)/i.test(err)) throw new PlanLimitError(`${sport} ${date}: ${err}`);
  if (err) throw new ApiSportsError(`${sport} ${date}: ${err}`);

  if (sport === "futebol") {
    return (body.response as FootballFixture[])
      .filter((f) => f.league.country === "Brazil")
      .map((f) => ({
        externalId: `futebol:${f.fixture.id}`,
        sport,
        startsAt: f.fixture.date,
        statusShort: f.fixture.status.short,
        leagueId: f.league.id,
        leagueName: f.league.name,
        round: f.league.round ?? null,
        home: f.teams.home.name,
        homeId: f.teams.home.id ?? null,
        homeLogo: f.teams.home.logo ?? null,
        away: f.teams.away.name,
        awayLogo: f.teams.away.logo ?? null,
        leagueLogo: f.league.logo ?? null,
        venueId: f.fixture.venue?.id ?? null,
        venueName: f.fixture.venue?.name ?? null,
        venueCity: f.fixture.venue?.city ?? null,
        venueFrom: "fixture" as const,
      }));
  }

  return (body.response as Game[])
    .filter((g) => g.country?.name === "Brazil")
    .map((g) => ({
      externalId: `${sport}:${g.id}`,
      sport,
      startsAt: g.date,
      statusShort: g.status.short,
      leagueId: g.league.id,
      leagueName: g.league.name,
      round: g.week ?? null,
      home: g.teams.home.name,
      homeId: null,
      homeLogo: g.teams.home.logo ?? null,
      away: g.teams.away.name,
      awayLogo: g.teams.away.logo ?? null,
      leagueLogo: g.league.logo ?? null,
      venueId: null,
      venueName: null,
      venueCity: null,
    }));
}

export type Venue = { name: string | null; city: string | null };

async function getJson(url: string, apiKey: string) {
  const res = await fetch(url, { headers: { "x-apisports-key": apiKey }, cache: "no-store" });
  if (!res.ok) throw new ApiSportsError(`HTTP ${res.status} em ${url}`);
  const body = (await res.json()) as ApiResponse<unknown>;
  const err = errorText(body.errors);
  if (err) throw new ApiSportsError(err);
  return body.response;
}

/** Estádio de um local já conhecido pelo id (futebol). */
export async function fetchFootballVenue(venueId: number, apiKey: string): Promise<Venue | null> {
  const r = (await getJson(`${HOSTS.futebol.base}/venues?id=${venueId}`, apiKey)) as Venue[];
  return r[0] ? { name: r[0].name, city: r[0].city } : null;
}

/** Estádio cadastrado do time (futebol), usado quando o jogo vem sem local. */
export async function fetchFootballTeamVenue(teamId: number, apiKey: string): Promise<Venue | null> {
  const r = (await getJson(`${HOSTS.futebol.base}/teams?id=${teamId}`, apiKey)) as { venue?: Venue }[];
  const v = r[0]?.venue;
  return v ? { name: v.name, city: v.city } : null;
}

/** Jogos que não vão mais acontecer nessa data. */
export const CANCELLED = new Set(["PST", "POST", "CANC", "ABD", "AWD", "WO", "AW"]);

/** Duração estimada de cada esporte (a API não informa o fim). */
export const DURATION_MIN: Record<SportKey, number> = { futebol: 120, basquete: 135, volei: 150 };
