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
  away: string;
  venueName: string | null;
  venueCity: string | null;
};

type FootballFixture = {
  fixture: { id: number; date: string; status: { short: string }; venue: { name: string | null; city: string | null } };
  league: { id: number; name: string; country: string; round?: string };
  teams: { home: { name: string }; away: { name: string } };
};

type Game = {
  id: number;
  date: string;
  status: { short: string };
  country: { name: string };
  league: { id: number; name: string };
  week?: string | null;
  teams: { home: { name: string }; away: { name: string } };
};

type ApiResponse<T> = { errors: unknown; response: T[] };

export class ApiSportsError extends Error {}

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
        away: f.teams.away.name,
        venueName: f.fixture.venue?.name ?? null,
        venueCity: f.fixture.venue?.city ?? null,
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
      away: g.teams.away.name,
      venueName: null,
      venueCity: null,
    }));
}

/** Jogos que não vão mais acontecer nessa data. */
export const CANCELLED = new Set(["PST", "POST", "CANC", "ABD", "AWD", "WO", "AW"]);

/** Duração estimada de cada esporte (a API não informa o fim). */
export const DURATION_MIN: Record<SportKey, number> = { futebol: 120, basquete: 135, volei: 150 };
