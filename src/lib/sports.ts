import type { Sport } from "./types";

export const SPORTS: Sport[] = [
  { slug: "jiu-jitsu", name: "Jiu-jitsu", emoji: "🥋" },
  { slug: "mma", name: "MMA", emoji: "🥊" },
  { slug: "basquete", name: "Basquete", emoji: "🏀" },
  { slug: "futebol", name: "Futebol", emoji: "⚽" },
  { slug: "futsal", name: "Futsal", emoji: "👟" },
  { slug: "volei", name: "Vôlei", emoji: "🏐" },
];

export const SPORTS_BY_SLUG = new Map(SPORTS.map((s) => [s.slug, s]));

export function getSport(slug: string): Sport {
  return SPORTS_BY_SLUG.get(slug) ?? { slug, name: slug, emoji: "🏅" };
}
