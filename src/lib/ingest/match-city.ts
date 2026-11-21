import { CITIES } from "../cities";

/** "São Paulo" -> "sao paulo" */
export function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const CITY_BY_NAME = new Map(CITIES.map((c) => [normalize(c.name), c.slug]));

/** Cidade do estádio vinda da fonte ("Sao Paulo", "Belo Horizonte, Minas Gerais"...) -> slug da capital. */
export function cityFromVenueCity(venueCity: string | null | undefined): string | null {
  if (!venueCity) return null;
  const first = normalize(venueCity.split(/[,/-]/)[0]);
  return CITY_BY_NAME.get(first) ?? CITY_BY_NAME.get(normalize(venueCity)) ?? null;
}

/**
 * Times de basquete, vôlei, handebol e rugby que mandam jogos em capitais. Usado só para esses esportes, porque essas APIs
 * não informam o ginásio. No futebol a cidade vem sempre do estádio (sem estádio, o jogo é ignorado).
 *
 * A comparação é pelo NOME INTEIRO do time (sem acento, minúsculo), aceitando só sufixos como "W", "Feminino",
 * "Basquete" ou "Vôlei". Assim "Paulistano" casa, mas "Frei Paulistano" (Sergipe) não.
 * Na dúvida o jogo fica de fora: é melhor faltar um jogo do que mostrar na cidade errada.
 */
const TEAMS: Record<string, string[]> = {
  "sao-paulo": ["sao paulo", "pinheiros", "paulistano", "corinthians", "palmeiras", "sesc sp", "hebraica", "spac", "sao paulo athletic club", "pasteur", "band saracens"],
  "rio-de-janeiro": ["flamengo", "fluminense", "vasco", "vasco da gama", "botafogo", "tijuca", "sesc rj", "sesc rj flamengo"],
  "belo-horizonte": ["minas", "minas tenis clube", "cruzeiro", "atletico mg", "america mg"],
  brasilia: ["brasilia", "brasilia basquete", "brasilia volei", "ceub"],
  fortaleza: ["fortaleza", "fortaleza basquete cearense", "fortaleza bc", "ceara"],
  "porto-alegre": ["gremio", "internacional", "sogipa"],
  curitiba: ["curitiba", "curitiba volei", "athletico pr", "coritiba"],
  recife: ["sport", "sport recife"],
  salvador: ["bahia", "vitoria ba"],
  goiania: ["goias", "goiania", "goiania volei"],
  florianopolis: ["florianopolis", "avai"],
  "campo-grande": ["campo grande"],
  manaus: ["manaus"],
  cuiaba: ["cuiaba"],
};

const SUFFIXES = "(?: (?:w|women|fem|feminino|masculino|basquete|basketball|volei|volleyball|handebol|handball|rugby|bc|ec|fc|sc|ac))*";
const TEAM_RULES: [RegExp, string][] = Object.entries(TEAMS).flatMap(([slug, names]) =>
  names.map((n) => [new RegExp(`^${n}${SUFFIXES}$`), slug] as [RegExp, string]),
);

/** Capital do time mandante, só quando o nome é exatamente de um time conhecido. */
export function cityFromTeam(teamName: string): string | null {
  const n = normalize(teamName);
  for (const [re, slug] of TEAM_RULES) if (re.test(n)) return slug;
  return null;
}
