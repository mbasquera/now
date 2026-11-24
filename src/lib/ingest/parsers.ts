import { CITIES } from "../cities";
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


// ---------- Corridas de rua: calendários oficiais das prefeituras ----------

/** "2026-11-22" (só a data: o horário não foi informado e aparece como "a confirmar"). */
function dateOnly(y: number, m: number, d: number) {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/**
 * Prefeitura de São Paulo (SEME): uma linha por corrida, "22/11/2026 | NOME | LOCAL DE LARGADA | ORGANIZADOR".
 * A página não informa horário, então o evento fica com "horário a confirmar".
 */
export function parseSpCorridas(html: string, pageUrl: string): ParsedEvent[] {
  const out: ParsedEvent[] = [];
  for (const line of htmlToLines(html)) {
    const m = line.match(/^(\d{2})\/(\d{2})\/(\d{4})\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*$/);
    if (!m) continue;
    out.push({
      name: m[4],
      startDate: dateOnly(+m[3], +m[2], +m[1]),
      url: pageUrl,
      venueName: m[5],
      locality: "São Paulo",
      sport: /ciclis|pedal|bike/i.test(m[4]) ? "ciclismo" : "corrida",
      description: `Prova de rua organizada por ${m[6]} (calendário oficial da Prefeitura de São Paulo).`,
    });
  }
  return out;
}

/** "8h", "6:30h", "10h30" -> [h, min] */
function parseHour(s: string): [number, number] | null {
  const m = s.match(/^(\d{1,2})(?:[:h](\d{2}))?h?$/i);
  if (!m || +m[1] > 23) return null;
  return [+m[1], +(m[2] ?? 0)];
}

/**
 * Prefeitura de Porto Alegre (SMEL): "22/11/2026 10h NOME 4km 10km LOCAL SITE".
 * O nome é o texto antes da primeira distância e o local é o texto depois da última.
 */
export function parsePoaCorridas(html: string, pageUrl: string): ParsedEvent[] {
  const out: ParsedEvent[] = [];
  const rows = [...html.matchAll(/<(tr|li|p)\b[^>]*>([\s\S]*?)<\/\1>/gi)].map((m) => textOf(m[2].replace(/<\/t[dh]>/gi, " ")));
  for (const row of rows) {
    const m = row.match(/^-?\s*(\d{2})\/(\d{2})\/(\d{4})\s+(\S+)\s+(.+)$/);
    if (!m) continue;
    const hour = parseHour(m[4]);
    let rest = hour ? m[5] : `${m[4]} ${m[5]}`;
    rest = rest.replace(/\s*\bSITE\b\s*$/i, "").trim();
    const dist = [...rest.matchAll(/\b\d+(?:[.,]\d+)?\s?km\b/gi)];
    if (!dist.length) continue;
    const first = dist[0];
    const last = dist[dist.length - 1];
    const name = rest.slice(0, first.index).trim();
    const venue = rest.slice((last.index ?? 0) + last[0].length).trim();
    if (!name || !venue) continue;
    const y = +m[3];
    const mo = +m[2];
    const d = +m[1];
    out.push({
      name,
      startDate: hour ? iso(y, mo, d, hour[0], hour[1]) : dateOnly(y, mo, d),
      url: pageUrl,
      venueName: venue,
      locality: "Porto Alegre",
      sport: "corrida",
      description: `Corrida de rua (${dist.map((x) => x[0].replace(/\s/g, "")).join(", ")}). Calendário oficial da Prefeitura de Porto Alegre.`,
    });
  }
  return out;
}

// ---------- intervals.icu (calendário de provas por país) ----------

const MONTHS_EN: Record<string, number> = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };

/** Esporte pelas etiquetas do fim da linha ("Run", "Ride", "Swim", "MTB", "Trail Run", "Open Water Swim"). */
function intervalsSport(tags: string[]): string | null {
  const run = tags.some((t) => /run/i.test(t));
  const ride = tags.some((t) => /ride|mtb/i.test(t));
  const swim = tags.some((t) => /swim/i.test(t));
  if (swim && (run || ride)) return "triatlo";
  if (swim) return "natacao";
  if (ride && run) return "triatlo"; // duatlo
  if (ride) return "ciclismo";
  if (run) return "corrida";
  return null;
}

/**
 * Cada prova aparece como "Nov 29, 2026 NOME Belo Horizonte, MG, Brasil Run Ride Swim".
 * O local tem formatos variados ("Brasília - Plano Piloto, Brasília - DF, Brasil", "Belo Horizonte, State of Minas
 * Gerais, Brazil"). Só aceita quando aparece o nome de uma capital seguido de "," ou " -"; o nome da prova é o que vem
 * antes. O esporte sai das etiquetas do fim.
 */
export function parseIntervals(html: string, pageUrl: string, capitals: { name: string; uf: string }[]): ParsedEvent[] {
  const text = htmlToLines(html).join(" ").replace(/https?:\/\/\S+/g, " ").replace(/\s+/g, " ");
  const dateRe = /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{1,2}), (\d{4}) /g;
  const marks = [...text.matchAll(dateRe)];
  const capRe = new RegExp(`(${capitals.map((c) => c.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})(?=\\s*[,-])`, "iu");
  const tagRe = /\s((?:(?:Open Water Swim|Trail Run|Run|Ride|Swim|MTB)\s*)+)$/;
  const out: ParsedEvent[] = [];
  marks.forEach((m, i) => {
    const entry = text.slice((m.index ?? 0) + m[0].length, marks[i + 1]?.index ?? text.length).trim();
    const tagMatch = entry.match(tagRe);
    if (!tagMatch) return;
    const sport = intervalsSport(tagMatch[1].trim().split(/\s+(?=[A-Z])/));
    const body = entry.slice(0, tagMatch.index).trim();
    if (!sport || !/\b(Brasil|Brazil)$/.test(body)) return;
    const cm = body.match(capRe);
    if (!cm || cm.index === undefined) return;
    const cap = capitals.find((c) => normalize(c.name) === normalize(cm[1]))!;
    const name = body.slice(0, cm.index).replace(/[\s.·,-]+$/, "").trim();
    if (!name) return;
    out.push({
      name,
      startDate: dateOnly(+m[3], MONTHS_EN[m[1].toLowerCase()], +m[2]),
      url: pageUrl,
      locality: cap.name,
      sport,
      description: "Prova listada no calendário do intervals.icu. Confira local e horário no site do organizador.",
    });
  });
  return out;
}

/** Leitor específico para a página, se houver. */
// ---------- ESPN (calendário de futebol, reserva da API) ----------

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => !!v && typeof v === "object" && !Array.isArray(v);
const s = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : undefined);

/** Os dados que a própria página da ESPN usa para se montar (window['__espnfitt__'] = {...}). */
function espnData(html: string): unknown[] {
  const out: unknown[] = [];
  for (const m of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)) {
    const j = m[1].match(/__espnfitt__['"]?\]?\s*=\s*(\{[\s\S]*\})\s*;?\s*$/);
    if (!j) continue;
    try {
      out.push(JSON.parse(j[1]));
    } catch {
      // formato mudou: ignora
    }
  }
  return out;
}

function teamOf(c: unknown): string | undefined {
  if (!isObj(c)) return undefined;
  const t = isObj(c.team) ? c.team : c;
  return s(t.displayName) ?? s(t.name) ?? s(t.shortDisplayName);
}

/** Estádio e cidade: só aceita quando a ESPN diz que é no Brasil. */
function venueOf(v: unknown): { venueName: string; city: string } | null {
  let name: string | undefined, city: string | undefined, country: string | undefined;
  if (typeof v === "string") {
    const parts = v.split(",").map((x) => x.trim()).filter(Boolean);
    if (parts.length < 3) return null;
    country = parts.pop();
    city = parts.pop();
    name = parts.join(", ");
  } else if (isObj(v)) {
    const a = isObj(v.address) ? v.address : {};
    name = s(v.fullName) ?? s(v.name) ?? s(v.displayName);
    city = s(a.city);
    country = s(a.country);
  }
  if (!name || !city || !country || !/^bra[sz]il$/.test(normalize(country))) return null;
  return { venueName: name, city };
}

/**
 * Página de calendário de futebol da ESPN. Lê os jogos dos dados da própria página: horário em UTC (sem dúvida de fuso),
 * os dois times e o estádio com cidade e país. Jogo fora do Brasil, sem estádio, adiado ou cancelado fica de fora.
 * Se a ESPN mudar o formato, não acha nada.
 */
export function parseEspn(html: string, pageUrl: string): ParsedEvent[] {
  const out = new Map<string, ParsedEvent>();
  const base = new URL(pageUrl);
  const visit = (node: unknown, depth: number) => {
    if (depth > 40) return;
    if (Array.isArray(node)) {
      for (const n of node) visit(n, depth + 1);
      return;
    }
    if (!isObj(node)) return;
    const date = s(node.date);
    const comps = node.competitors;
    if (date && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:?\d{2})$/.test(date) && Array.isArray(comps) && comps.length === 2) {
      const venue = venueOf(node.venue);
      const status = JSON.stringify(node.status ?? "").toLowerCase();
      const off = /postpon|aplazad|adiad|cancel|suspend/.test(status);
      const home = comps.find((c) => isObj(c) && (c.isHome === true || c.homeAway === "home")) ?? comps[0];
      const away = comps.find((c) => c !== home);
      const a = teamOf(home), b = teamOf(away);
      if (venue && !off && a && b) {
        let url = pageUrl;
        const link = s(node.link) ?? s(node.href);
        if (link) {
          try {
            const u = new URL(link, base);
            if (u.host === base.host) url = u.toString();
          } catch {
            // link inválido: fica a página do calendário
          }
        }
        const league = isObj(node.league) ? s(node.league.name) : undefined;
        out.set(`${url}|${date}|${a}`, {
          name: `${a} x ${b}`,
          startDate: date,
          url,
          venueName: venue.venueName,
          locality: venue.city,
          sport: "futebol",
          description: league,
        });
      }
    }
    for (const v of Object.values(node)) if (v && typeof v === "object") visit(v, depth + 1);
  };
  for (const d of espnData(html)) visit(d, 0);
  return [...out.values()];
}

export function parserFor(url: string): ((html: string, url: string) => ParsedEvent[]) | null {
  const u = new URL(url);
  if (u.host.endsWith("lnfoficial.com.br") && u.pathname.includes("tabela-de-jogos")) return parseLnf;
  if (u.host.endsWith("cbv.com.br") && u.pathname.includes("superliga")) return (h, p) => parseCbv(h, p);
  if (u.host.endsWith("prefeitura.sp.gov.br") && u.pathname.includes("corridas_de_rua")) return parseSpCorridas;
  if (u.host.endsWith("prefeitura.poa.br") && u.pathname.includes("corridas-de-rua")) return parsePoaCorridas;
  if (u.host.endsWith("intervals.icu") && u.pathname.startsWith("/events/BR/"))
    return (h, p) => parseIntervals(h, p, CITIES.map((c) => ({ name: c.name, uf: c.uf })));
  if (/(^|\.)espn(deportes)?\.com(\.br)?$/.test(u.host) && /\/(futbol|futebol)\/(calendario|agenda)/.test(u.pathname))
    return parseEspn;
  return null;
}
