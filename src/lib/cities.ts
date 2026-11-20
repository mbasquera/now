import type { City } from "./types";

/** As 27 capitais brasileiras, com o fuso IANA correto de cada uma. */
export const CITIES: City[] = [
  { slug: "rio-branco", name: "Rio Branco", uf: "AC", timezone: "America/Rio_Branco" },
  { slug: "maceio", name: "Maceió", uf: "AL", timezone: "America/Maceio" },
  { slug: "macapa", name: "Macapá", uf: "AP", timezone: "America/Belem" },
  { slug: "manaus", name: "Manaus", uf: "AM", timezone: "America/Manaus" },
  { slug: "salvador", name: "Salvador", uf: "BA", timezone: "America/Bahia" },
  { slug: "fortaleza", name: "Fortaleza", uf: "CE", timezone: "America/Fortaleza" },
  { slug: "brasilia", name: "Brasília", uf: "DF", timezone: "America/Sao_Paulo" },
  { slug: "vitoria", name: "Vitória", uf: "ES", timezone: "America/Sao_Paulo" },
  { slug: "goiania", name: "Goiânia", uf: "GO", timezone: "America/Sao_Paulo" },
  { slug: "sao-luis", name: "São Luís", uf: "MA", timezone: "America/Fortaleza" },
  { slug: "cuiaba", name: "Cuiabá", uf: "MT", timezone: "America/Cuiaba" },
  { slug: "campo-grande", name: "Campo Grande", uf: "MS", timezone: "America/Campo_Grande" },
  { slug: "belo-horizonte", name: "Belo Horizonte", uf: "MG", timezone: "America/Sao_Paulo" },
  { slug: "belem", name: "Belém", uf: "PA", timezone: "America/Belem" },
  { slug: "joao-pessoa", name: "João Pessoa", uf: "PB", timezone: "America/Fortaleza" },
  { slug: "curitiba", name: "Curitiba", uf: "PR", timezone: "America/Sao_Paulo" },
  { slug: "recife", name: "Recife", uf: "PE", timezone: "America/Recife" },
  { slug: "teresina", name: "Teresina", uf: "PI", timezone: "America/Fortaleza" },
  { slug: "rio-de-janeiro", name: "Rio de Janeiro", uf: "RJ", timezone: "America/Sao_Paulo" },
  { slug: "natal", name: "Natal", uf: "RN", timezone: "America/Fortaleza" },
  { slug: "porto-alegre", name: "Porto Alegre", uf: "RS", timezone: "America/Sao_Paulo" },
  { slug: "porto-velho", name: "Porto Velho", uf: "RO", timezone: "America/Porto_Velho" },
  { slug: "boa-vista", name: "Boa Vista", uf: "RR", timezone: "America/Boa_Vista" },
  { slug: "florianopolis", name: "Florianópolis", uf: "SC", timezone: "America/Sao_Paulo" },
  { slug: "sao-paulo", name: "São Paulo", uf: "SP", timezone: "America/Sao_Paulo" },
  { slug: "aracaju", name: "Aracaju", uf: "SE", timezone: "America/Maceio" },
  { slug: "palmas", name: "Palmas", uf: "TO", timezone: "America/Araguaina" },
];

export const CITIES_BY_SLUG = new Map(CITIES.map((c) => [c.slug, c]));

export function getCity(slug: string): City | undefined {
  return CITIES_BY_SLUG.get(slug);
}
