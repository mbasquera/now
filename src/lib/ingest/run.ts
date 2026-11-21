import type { SupabaseClient } from "@supabase/supabase-js";
import { getCity } from "../cities";
import { getSupabaseAdmin } from "../supabase/admin";
import {
  ApiSportsError,
  CANCELLED,
  DURATION_MIN,
  fetchBrazilGames,
  type ExternalGame,
  type SportKey,
} from "./apisports";
import { cityFromTeam, cityFromVenueCity } from "./match-city";

export const SOURCE = "api-sports";
const SPORTS: SportKey[] = ["futebol", "basquete", "volei"];
const DAYS_AHEAD = 7; // hoje + 6 dias = 7 consultas por esporte por dia
// Motivo usado quando a importação recusa sozinha um jogo adiado/cancelado (e pode reaprovar se ele voltar).
const AUTO_REASON = "Adiado ou cancelado segundo a fonte (importação automática).";

export type SportSummary = {
  found: number; // jogos no Brasil
  inCapitals: number; // jogos numa capital (os outros são ignorados)
  saved: number;
  cancelled: number;
  errors: string[];
};
export type ImportSummary = { ok: boolean; message?: string; sports: Partial<Record<SportKey, SportSummary>> };

/** Datas AAAA-MM-DD a partir de hoje, no horário de Brasília. */
function nextDates(days: number, from = new Date()): string[] {
  const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" });
  return Array.from({ length: days }, (_, i) => fmt.format(new Date(from.getTime() + i * 86_400_000)));
}

type Ids = { cities: Map<string, number>; sports: Map<string, number> };

async function loadIds(db: SupabaseClient): Promise<Ids> {
  const [{ data: cities, error: e1 }, { data: sports, error: e2 }] = await Promise.all([
    db.from("cities").select("id, slug"),
    db.from("sports").select("id, slug"),
  ]);
  if (e1 || e2) throw new Error(`Não consegui ler cidades/esportes: ${(e1 ?? e2)!.message}`);
  return {
    cities: new Map(cities!.map((c) => [c.slug as string, c.id as number])),
    sports: new Map(sports!.map((s) => [s.slug as string, s.id as number])),
  };
}

/** Um organizador por campeonato (ex.: "Serie A", "Paulista - A1"), criado na primeira vez. */
async function organizerIds(db: SupabaseClient, games: ExternalGame[]): Promise<Map<string, string>> {
  const byKey = new Map<string, string>();
  for (const g of games) byKey.set(`${SOURCE}:${g.sport}:${g.leagueId}`, g.leagueName);
  const rows = [...byKey].map(([source_key, name]) => ({ source_key, name }));
  const out = new Map<string, string>();
  for (let i = 0; i < rows.length; i += 200) {
    const { data, error } = await db
      .from("organizers")
      .upsert(rows.slice(i, i + 200), { onConflict: "source_key" })
      .select("id, source_key");
    if (error) throw new Error(`Não consegui salvar os campeonatos: ${error.message}`);
    data!.forEach((o) => out.set(o.source_key as string, o.id as string));
  }
  return out;
}

async function existingStatus(db: SupabaseClient, externalIds: string[]) {
  const out = new Map<string, { status: string; rejection_reason: string | null }>();
  for (let i = 0; i < externalIds.length; i += 200) {
    const { data, error } = await db
      .from("events")
      .select("external_id, status, rejection_reason")
      .eq("source", SOURCE)
      .in("external_id", externalIds.slice(i, i + 200));
    if (error) throw new Error(`Não consegui ler eventos já importados: ${error.message}`);
    data!.forEach((e) => out.set(e.external_id as string, e));
  }
  return out;
}

function sportTitle(g: ExternalGame) {
  return `${g.home} x ${g.away}`.slice(0, 120);
}

/**
 * A API-Sports não tem página pública por jogo, então o link para conferir é uma busca no Google
 * pelo confronto e a data (o Google mostra o card oficial do jogo com horário e estádio).
 */
function checkUrl(g: ExternalGame, start: Date) {
  const day = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo" }).format(start);
  const q = `${g.home} x ${g.away} ${g.leagueName} ${day}`;
  return `https://www.google.com/search?q=${encodeURIComponent(q)}`;
}

async function importSport(db: SupabaseClient, ids: Ids, sport: SportKey, apiKey: string): Promise<SportSummary> {
  const summary: SportSummary = { found: 0, inCapitals: 0, saved: 0, cancelled: 0, errors: [] };
  const sportId = ids.sports.get(sport);
  if (!sportId) {
    summary.errors.push(`Esporte "${sport}" não existe na tabela sports (rode o supabase/base.sql).`);
    return summary;
  }

  const results = await Promise.allSettled(nextDates(DAYS_AHEAD).map((d) => fetchBrazilGames(sport, d, apiKey)));
  const games: { game: ExternalGame; citySlug: string }[] = [];
  for (const r of results) {
    if (r.status === "rejected") {
      summary.errors.push(r.reason instanceof ApiSportsError ? r.reason.message : String(r.reason));
      continue;
    }
    for (const game of r.value) {
      summary.found++;
      const citySlug = cityFromVenueCity(game.venueCity) ?? cityFromTeam(game.home);
      if (citySlug && ids.cities.has(citySlug)) games.push({ game, citySlug });
    }
  }
  summary.inCapitals = games.length;
  if (!games.length) return summary;

  const orgs = await organizerIds(db, games.map((g) => g.game));
  const existing = await existingStatus(db, games.map((g) => g.game.externalId));

  const rowsById = new Map<string, Record<string, unknown>>();
  for (const { game, citySlug } of games) {
    const prev = existing.get(game.externalId);
    const cancelled = CANCELLED.has(game.statusShort);
    if (cancelled && !prev) continue; // nunca entrou: não precisa nem aparecer

    // Mantém a decisão do admin: um jogo recusado à mão continua recusado.
    let status = prev?.status ?? "approved";
    let rejection_reason = prev?.rejection_reason ?? null;
    if (cancelled) {
      status = "rejected";
      rejection_reason = AUTO_REASON;
      summary.cancelled++;
    } else if (prev?.rejection_reason === AUTO_REASON) {
      status = "approved"; // foi remarcado e voltou
      rejection_reason = null;
    }

    const city = getCity(citySlug)!;
    const start = new Date(game.startsAt);
    const end = new Date(start.getTime() + DURATION_MIN[sport] * 60_000);
    const venue = game.venueName || `Mando de ${game.home}`;
    rowsById.set(game.externalId, {
      source: SOURCE,
      external_id: game.externalId,
      organizer_id: orgs.get(`${SOURCE}:${sport}:${game.leagueId}`)!,
      city_id: ids.cities.get(citySlug)!,
      sport_id: sportId,
      title: sportTitle(game),
      description: [game.leagueName, game.round].filter(Boolean).join(" · "),
      venue_name: venue,
      address: `${city.name} - ${city.uf}`,
      starts_at: start.toISOString(),
      ends_at: end.toISOString(),
      is_free: false,
      price_cents: null,
      source_url: checkUrl(game, start),
      status,
      rejection_reason,
    });
  }

  const rows = [...rowsById.values()];
  for (let i = 0; i < rows.length; i += 200) {
    const { error } = await db.from("events").upsert(rows.slice(i, i + 200), { onConflict: "source,external_id" });
    if (error) summary.errors.push(`Erro ao salvar: ${error.message}`);
    else summary.saved += Math.min(200, rows.length - i);
  }
  return summary;
}

/** Busca os jogos dos próximos dias e grava/atualiza na tabela events. Registra em import_runs. */
export async function runImport(trigger: "cron" | "admin"): Promise<ImportSummary> {
  const apiKey = process.env.API_SPORTS_KEY?.trim();
  const db = getSupabaseAdmin();
  if (!db) return { ok: false, message: "Falta SUPABASE_SECRET_KEY nas variáveis de ambiente.", sports: {} };
  if (!apiKey) return { ok: false, message: "Falta API_SPORTS_KEY nas variáveis de ambiente.", sports: {} };

  const { data: run, error: runError } = await db.from("import_runs").insert({ trigger }).select("id").single();
  if (runError) {
    return {
      ok: false,
      message: `Não consegui registrar a importação (${runError.message}). Rode supabase/migrations/0003_importacao.sql no Supabase.`,
      sports: {},
    };
  }
  let summary: ImportSummary;
  try {
    const ids = await loadIds(db);
    const sports: ImportSummary["sports"] = {};
    for (const s of SPORTS) sports[s] = await importSport(db, ids, s, apiKey);
    const ok = Object.values(sports).every((s) => s!.errors.length === 0);
    summary = { ok, sports };
  } catch (e) {
    summary = { ok: false, message: e instanceof Error ? e.message : String(e), sports: {} };
  }
  if (run) {
    await db
      .from("import_runs")
      .update({ finished_at: new Date().toISOString(), ok: summary.ok, summary })
      .eq("id", run.id);
  }
  return summary;
}
