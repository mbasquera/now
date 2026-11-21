import { normalize } from "./match-city";

/**
 * Leitores específicos para sites oficiais que publicam a agenda em HTML comum (sem schema.org).
 * Cada leitor só aceita jogos em que a própria página informa data, hora, ginásio e cidade.
 * Se o site mudar o formato, o leitor simplesmente não acha nada (não adivinha).
 */

export type ParsedEvent = {
  name: string;
  startDate: string; // ISO com fuso de Brasília
  url: string;
  venueName?: string;
  locality?: string;
  sport?: string;
  description?: string;
};

const ENTITIES: Record<string, string> = { amp: "&", nbsp: " ", quot: '"', apos: "'", lt: "<", gt: ">", middot: "·" };

export function decode(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? m);
}

function textOf(html: string): string {
  return decode(html.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

/** HTML -> linhas de texto (uma por bloco), sem scripts e estilos. */
export function htmlToLines(html: string): string[] {
  const body = html
    .replace(/<(script|style|noscript|svg)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/?(p|div|li|tr|td|th|h[1-6]|section|article|ul|ol|table|header|footer)\b[^>]*>/gi, "\n");
  return decode(body.replace(/<[^>]+>/g, " "))
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function iso(y: number, m: number, d: number, h: number, min: number) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${y}-${p(m)}-${p(d)}T${p(h)}:${p(min)}:00-03:00`;
}

/** Ano de uma data sem ano ("21/11"): o que deixa a data mais perto de hoje (de 2 meses atrás a 10 meses à frente). */
export function guessYear(day: number, month: number, now = new Date()): number {
  const y = now.getFullYear();
  for (const year of [y - 1, y, y + 1]) {
    const t = Date.UTC(year, month - 1, day);
    if (t >= now.getTime() - 60 * 86_400_000 && t < now.getTime() + 300 * 86_400_000) return year;
  }
  return y;
}

/** "Corinthians COR" -> "Corinthians" (tira a sigla do fim). */
function teamName(s: string) {
  return s.replace(/\s+[A-Z]{2,4}$/, "").trim();
}

// ---------- Liga Nacional de Futsal (lnfoficial.com.br/tabela-de-jogos/) ----------

/**
 * A tabela tem as colunas DATA | HORA | EQUIPE LOCAL | X | EQUIPE VISITANTE | GINÁSIO | CIDADE | UF.
 * As colunas são achadas pelo nome do cabeçalho, não pela posição.
 */
export function parseLnf(html: string, pageUrl: string): ParsedEvent[] {
  const rows = [...html.matchAll(/<tr\b[\s\S]*?<\/tr>/gi)].map((m) =>
    [...m[0].matchAll(/<t[hd]\b[^>]*>([\s\S]*?)<\/t[hd]>/gi)].map((c) => textOf(c[1])),
  );
  let col: Record<string, number> | null = null;
  const out: ParsedEvent[] = [];
  for (const cells of rows) {
    const norm = cells.map((c) => normalize(c));
    if (norm.some((c) => c.startsWith("ginasio")) && norm.some((c) => c.startsWith("cidade"))) {
      const find = (p: string) => norm.findIndex((c) => c.startsWith(p));
      col = {
        data: find("data"),
        hora: find("hora"),
        local: find("equipe local"),
        visitante: find("equipe visitante"),
        ginasio: find("ginasio"),
        cidade: find("cidade"),
      };
      continue;
    }
    if (!col || col.data < 0 || col.ginasio < 0 || col.cidade < 0) continue;
    const date = cells[col.data]?.match(/(\d{2})\/(\d{2})\/(\d{4})/);
    const time = (cells[col.hora] ?? cells[col.data] ?? "").match(/(\d{1,2}):(\d{2})/);
    const venue = cells[col.ginasio];
    const city = cells[col.cidade];
    const home = teamName(cells[col.local] ?? "");
    const away = teamName(cells[col.visitante] ?? "");
    if (!date || !time || !venue || !city || !home || !away) continue;
    out.push({
      name: `${home} x ${away}`,
      startDate: iso(+date[3], +date[2], +date[1], +time[1], +time[2]),
      url: pageUrl,
      venueName: venue,
      locality: city,
      sport: "futsal",
      description: "Liga Nacional de Futsal (tabela oficial da LNF).",
    });
  }
  return out;
}

// ---------- Superliga de vôlei (cbv.com.br/volei-de-quadra/superliga-a-...) ----------

/**
 * Cada jogo aparece como:
 *   Jogo 28 · Rodada 5
 *   FARMA CONDE ARENA · SAO JOSE DOS CAMPOS
 *   sáb 21/11 · 16h00
 *   VIAPOL VÔLEI SÃO JOSÉ / VSJ / SADA CRUZEIRO VOLEI / SDC
 * Jogo sem a linha "GINÁSIO · CIDADE" é ignorado.
 */
export function parseCbv(html: string, pageUrl: string, now = new Date()): ParsedEvent[] {
  const lines = htmlToLines(html);
  const league = /feminin/i.test(pageUrl) ? "Superliga Feminina" : "Superliga Masculina";
  const out: ParsedEvent[] = [];
  for (let i = 0; i < lines.length; i++) {
    const head = lines[i].match(/^Jogo (\d+)\s*[·•-]\s*Rodada (\d+)$/i);
    if (!head) continue;
    let venue: string | undefined;
    let city: string | undefined;
    let dateIdx = -1;
    let date: RegExpMatchArray | null = null;
    for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
      date = lines[j].match(/(\d{1,2})\/(\d{1,2})\s*[·•-]\s*(\d{1,2})h(\d{2})?/i);
      if (date) {
        dateIdx = j;
        break;
      }
      const vc = lines[j].split(/\s*[·•]\s*/);
      if (vc.length === 2 && vc[0] && vc[1]) [venue, city] = vc;
    }
    if (!date || !venue || !city) continue;
    const teams: string[] = [];
    for (let j = dateIdx + 1; j < Math.min(dateIdx + 8, lines.length) && teams.length < 2; j++) {
      const l = lines[j];
      if (/^jogo \d+/i.test(l) || /onde assistir/i.test(l)) break;
      if (/^[A-Z]{2,4}$/.test(l) || /^\d+$/.test(l) || l.length < 4) continue;
      teams.push(l);
    }
    if (teams.length < 2) continue;
    const day = +date[1];
    const month = +date[2];
    const year = guessYear(day, month, now);
    out.push({
      name: `${league}: ${teams[0]} x ${teams[1]}`,
      startDate: iso(year, month, day, +date[3], +(date[4] ?? 0)),
      url: pageUrl,
      venueName: venue,
      locality: city,
      sport: "volei",
      description: `${league}, jogo ${head[1]}, rodada ${head[2]} (agenda oficial da CBV).`,
    });
  }
  return out;
}

/** Leitor específico para a página, se houver. */
export function parserFor(url: string): ((html: string, url: string) => ParsedEvent[]) | null {
  const u = new URL(url);
  if (u.host.endsWith("lnfoficial.com.br") && u.pathname.includes("tabela-de-jogos")) return parseLnf;
  if (u.host.endsWith("cbv.com.br") && u.pathname.includes("superliga")) return (h, p) => parseCbv(h, p);
  return null;
}
