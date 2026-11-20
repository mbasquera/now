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
 * Clubes conhecidos que mandam jogos em capitais. Usado quando a fonte não informa o estádio
 * (basquete e vôlei nunca informam). A primeira regra que casar vence, então as mais específicas vêm antes.
 * Edite à vontade: é só o nome do time (sem acento, minúsculo) e o slug da capital.
 */
const TEAM_RULES: [RegExp, string][] = [
  [/\bbotafogo (pb|jp)\b/, "joao-pessoa"],
  [/\bamerica (rn|natal)\b/, "natal"],
  [/\bamerica (mg|mineiro)\b/, "belo-horizonte"],
  [/\batletico (go|goianiense)\b/, "goiania"],
  [/\batletico (mg|mineiro)\b/, "belo-horizonte"],
  [/\bathletico\b/, "curitiba"],
  [/\bsada cruzeiro\b/, "belo-horizonte"],
  [/\bvitoria (es|espirito santo)\b/, "vitoria"],
  [/\b(ec )?vitoria\b/, "salvador"], // EC Vitória é de Salvador
  [/\bsao paulo\b/, "sao-paulo"],
  [/\b(corinthians|palmeiras|pinheiros|paulistano|portuguesa|juventus sp|nacional sp)\b/, "sao-paulo"],
  [/\b(flamengo|fluminense|vasco|botafogo|tijuca|madureira|bangu|olaria|sesc rj)\b/, "rio-de-janeiro"],
  [/\b(minas|cruzeiro)\b/, "belo-horizonte"],
  [/\b(gremio|internacional|sao jose rs)\b/, "porto-alegre"],
  [/\b(coritiba|parana clube)\b/, "curitiba"],
  [/\b(sport recife|nautico|santa cruz|retro)\b/, "recife"],
  [/\b(bahia|ypiranga ba)\b/, "salvador"],
  [/\b(ceara|ferroviario)\b/, "fortaleza"],
  [/\b(goias|vila nova)\b/, "goiania"],
  [/\b(paysandu|remo|tuna luso)\b/, "belem"],
  [/\b(amazonas|nacional am)\b/, "manaus"],
  [/\babc\b/, "natal"],
  [/\b(crb|csa)\b/, "maceio"],
  [/\b(confianca|sergipe)\b/, "aracaju"],
  [/\briver pi\b/, "teresina"],
  [/\b(sampaio correa|moto club)\b/, "sao-luis"],
  [/\b(avai|figueirense)\b/, "florianopolis"],
  [/\b(gama|ceub|capital df|real brasilia)\b/, "brasilia"],
  [/\b(mixto|operario mt)\b/, "cuiaba"],
  [/\boperario ms\b/, "campo-grande"],
  [/\bdesportiva\b/, "vitoria"],
];

// Nomes de capital que também são nome de time e apontariam para a cidade errada.
const AMBIGUOUS_CITY_NAMES = new Set(["vitoria"]);

/** Tenta descobrir a capital pelo nome do time mandante. */
export function cityFromTeam(teamName: string): string | null {
  const n = normalize(teamName);
  for (const [re, slug] of TEAM_RULES) if (re.test(n)) return slug;
  for (const [name, slug] of CITY_BY_NAME) {
    if (AMBIGUOUS_CITY_NAMES.has(name)) continue;
    if (new RegExp(`\\b${name}\\b`).test(n)) return slug;
  }
  return null;
}
