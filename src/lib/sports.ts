import type { Sport } from "./types";

export const SPORTS: Sport[] = [
  { slug: "futebol", name: "Futebol", emoji: "⚽", color: "#22c55e" },
  { slug: "futsal", name: "Futsal", emoji: "👟", color: "#38bdf8" },
  { slug: "basquete", name: "Basquete", emoji: "🏀", color: "#fb923c" },
  { slug: "volei", name: "Vôlei", emoji: "🏐", color: "#facc15" },
  { slug: "jiu-jitsu", name: "Jiu-jitsu", emoji: "🥋", color: "#a78bfa" },
  { slug: "mma", name: "MMA", emoji: "🥊", color: "#f43f5e" },
  { slug: "handebol", name: "Handebol", emoji: "🤾", color: "#2dd4bf" },
  { slug: "rugby", name: "Rugby", emoji: "🏉", color: "#a3e635" },
  { slug: "corrida", name: "Corrida", emoji: "🏃", color: "#f472b6" },
  { slug: "ciclismo", name: "Ciclismo", emoji: "🚴", color: "#60a5fa" },
  { slug: "triatlo", name: "Triatlo", emoji: "🏊", color: "#22d3ee" },
];

export const SPORTS_BY_SLUG = new Map(SPORTS.map((s) => [s.slug, s]));

export function getSport(slug: string): Sport {
  return SPORTS_BY_SLUG.get(slug) ?? { slug, name: slug, emoji: "🏅", color: "#94a3b8" };
}

/** Esportes disputados entre dois times (o card mostra um "placar" com os escudos). */
export const TEAM_SPORTS = new Set(["futebol", "futsal", "basquete", "volei", "handebol", "rugby"]);

export type Photo = { id: string; author: string; handle: string; page: string };

/**
 * Fotos de capa por esporte, todas com a Licença Unsplash (uso livre, inclusive comercial).
 * Carregadas direto do CDN do Unsplash; se não carregarem, fica a ilustração do esporte por baixo.
 */
export const SPORT_PHOTOS: Record<string, Photo> = {
  futebol: {
    id: "photo-1762013315117-1c8005ad2b41",
    author: "Eduard Delputte",
    handle: "edelputte",
    page: "https://unsplash.com/photos/65yjpk2HSlA",
  },
  futsal: {
    id: "photo-1763775594018-4a84eeadd83d",
    author: "Alfonso Scarpa",
    handle: "lucidistortephoto",
    page: "https://unsplash.com/photos/f44zfM0Vn8w",
  },
  basquete: {
    id: "photo-1765924705648-9a0731ac5202",
    author: "Tom Macret",
    handle: "tom_macret",
    page: "https://unsplash.com/photos/9o4n4pI8kR8",
  },
  volei: {
    id: "photo-1612872087720-bb876e2e67d1",
    author: "Jannes Glas",
    handle: "jannesglas",
    page: "https://unsplash.com/photos/0NaQQsLWLkA",
  },
  "jiu-jitsu": {
    id: "photo-1780476870847-1023657f91cb",
    author: "Diego Corona",
    handle: "cldiego",
    page: "https://unsplash.com/photos/kgMaaK4zI38",
  },
  mma: {
    id: "photo-1777305628889-13832df3e542",
    author: "Gabriel F Rodrigues",
    handle: "gfrshoots",
    page: "https://unsplash.com/photos/CtmroEwoSKY",
  },
};

export const HERO_PHOTO: Photo = {
  id: "photo-1783464553874-4034f3db7c8d",
  author: "Karsten Winegeart",
  handle: "_karsten",
  page: "https://unsplash.com/photos/DtjUdpHuc-I",
};

export function photoUrl(photo: Photo, width: number): string {
  return `https://images.unsplash.com/${photo.id}?auto=format&fit=crop&w=${width}&q=70`;
}
