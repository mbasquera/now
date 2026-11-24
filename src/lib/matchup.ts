import { TEAM_SPORTS } from "./sports";
import type { SportEvent, Team } from "./types";

/**
 * Os dois times de um jogo: os campos da fonte quando existem; senão, lidos do título "A x B"
 * (ex.: "Corinthians x Palmeiras" ou "Superliga: Sesi x Minas"). Nada é inventado: sem "x", não é confronto.
 */
export function getMatchup(event: SportEvent): { home: Team; away: Team } | null {
  if (event.home && event.away) return { home: event.home, away: event.away };
  if (!TEAM_SPORTS.has(event.sportSlug)) return null;
  const m = event.title.match(/^(?:[^:]{2,60}:\s*)?(.{2,60}?)\s+(?:x|X|vs\.?)\s+(.{2,60})$/);
  if (!m) return null;
  return { home: { name: m[1].trim(), logo: null }, away: { name: m[2].trim(), logo: null } };
}

