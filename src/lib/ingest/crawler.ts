import type { SupabaseClient } from "@supabase/supabase-js";
import { getCity } from "../cities";
import { UNKNOWN_VENUE } from "../source";
import { checkSecretKey, getSupabaseAdmin } from "../supabase/admin";
import { cityFromVenueCity, normalize } from "./match-city";

/**
 * Leitor "educado" de sites públicos de eventos.
 *
 * - Respeita o robots.txt de cada site (se proibir, não lê) e o Crawl-delay; espera pelo menos 5 s entre
 *   duas páginas do mesmo site e lê no máximo PAGES_PER_SOURCE páginas por site em cada execução.
 * - Não relê a mesma página de evento por 24 h (tabela crawl_pages).
 * - Só entende dados estruturados schema.org (JSON-LD do tipo Event/SportsEvent), que os sites publicam
 *   justamente para buscadores. Sem isso, não adivinha nada.
 * - Evento sem cidade de capital, sem esporte reconhecível ou sem data é ignorado.
 * - Tudo entra como PENDENTE, com o link da página como fonte, para o admin conferir.
 */

export const SITE_SOURCE = "site";
const USER_AGENT = "NOWBot/1.0 (agenda de esportes; +https://now-nine-ashy.vercel.app)";
const MIN_DELAY_MS = 5_000;
const PAGES_PER_SOURCE = 4;
const TIME_BUDGET_MS = 50_000; // a função da Vercel tem 60 s
const MAX_BYTES = 2_000_000;
const LOOKAHEAD_DAYS = 30;

type Robots = { disallow: string[]; allow: string[]; delayMs: number; blocked: boolean };
const robotsCache = new Map<string, Robots>();
const lastHit = new Map<string, number>();

async function robotsFor(origin: string): Promise<Robots> {
  const cached = robotsCache.get(origin);
  if (cached) return cached;
  let r: Robots = { disallow: [], allow: [], delayMs: MIN_DELAY_MS, blocked: false };
  try {
    const res = await fetch(`${origin}/robots.txt`, { headers: { "user-agent": USER_AGENT }, cache: "no-store" });
    if (res.status >= 500) r.blocked = true; // site com problema: melhor não insistir
    else if (res.ok) r = { ...parseRobots(await res.text()), blocked: false };
  } catch {
    r.blocked = true;
  }
  robotsCache.set(origin, r);
  return r;
}

/** Lê as regras do grupo "*" (ou "nowbot", se houver). */
export function parseRobots(txt: string): Omit<Robots, "blocked"> {
  const groups: { agents: string[]; disallow: string[]; allow: string[]; delay?: number }[] = [];
  let cur: (typeof groups)[number] | null = null;
  let lastWasAgent = false;
  for (const raw of txt.split(/\r?\n/)) {
    const line = raw.replace(/#.*/, "").trim();
    const m = line.match(/^([a-z-]+)\s*:\s*(.*)$/i);
    if (!m) continue;
    const [, k, v] = m;
    const key = k.toLowerCase();
    if (key === "user-agent") {
      if (!cur || !lastWasAgent) groups.push((cur = { agents: [], disallow: [], allow: [] }));
      cur.agents.push(v.toLowerCase());
      lastWasAgent = true;
      continue;
    }
    lastWasAgent = false;
    if (!cur) continue;
    if (key === "disallow" && v) cur.disallow.push(v);
    if (key === "allow" && v) cur.allow.push(v);
    if (key === "crawl-delay" && !Number.isNaN(Number(v))) cur.delay = Number(v) * 1000;
  }
  const g = groups.find((x) => x.agents.includes("nowbot")) ?? groups.find((x) => x.agents.includes("*"));
  return {
    disallow: g?.disallow ?? [],
    allow: g?.allow ?? [],
    delayMs: Math.max(MIN_DELAY_MS, g?.delay ?? 0),
  };
}

function ruleMatches(rule: string, path: string) {
  const re = new RegExp(
    "^" + rule.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\\\$$/, "$"),
  );
  return re.test(path);
}

export function allowedByRobots(r: Pick<Robots, "allow" | "disallow">, path: string) {
  const longest = (rules: string[]) => Math.max(-1, ...rules.filter((x) => ruleMatches(x, path)).map((x) => x.length));
  return longest(r.allow) >= longest(r.disallow);
}

class Skip extends Error {}

/** Busca uma página respeitando robots.txt e o intervalo mínimo por site. */
async function politeFetch(url: string, deadline: number): Promise<string> {
  const u = new URL(url);
  const robots = await robotsFor(u.origin);
  if (robots.blocked) throw new Skip("robots.txt indisponível; site pulado");
  if (!allowedByRobots(robots, u.pathname + u.search)) throw new Skip("proibido pelo robots.txt");
  const wait = (lastHit.get(u.host) ?? 0) + robots.delayMs - Date.now();
  if (Date.now() + Math.max(0, wait) > deadline) throw new Skip("sem tempo nesta execução");
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastHit.set(u.host, Date.now());
  const res = await fetch(url, {
    headers: { "user-agent": USER_AGENT, accept: "text/html,application/xhtml+xml" },
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  return text.slice(0, MAX_BYTES);
}

// ---------- extração de schema.org ----------

type Json = Record<string, unknown>;
export type SiteEvent = {
  name: string;
  startDate: string;
  endDate?: string;
  url: string;
  venueName?: string;
  street?: string;
  locality?: string;
  isFree?: boolean;
  priceCents?: number | null;
  description?: string;
};

function asArray<T>(v: T | T[] | undefined | null): T[] {
  return v == null ? [] : Array.isArray(v) ? v : [v];
}
function str(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

function isEvent(o: Json) {
  return asArray(o["@type"] as string | string[]).some((t) => typeof t === "string" && /Event$/.test(t));
}

function walk(node: unknown, out: Json[]) {
  for (const n of asArray(node)) {
    if (!n || typeof n !== "object") continue;
    const o = n as Json;
    if (isEvent(o)) out.push(o);
    walk(o["@graph"], out);
    for (const item of asArray(o["itemListElement"] as unknown[])) walk((item as Json)?.item ?? item, out);
  }
}

/** Eventos schema.org (JSON-LD) de uma página. */
export function extractEvents(html: string, pageUrl: string): SiteEvent[] {
  const found: Json[] = [];
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  for (const m of html.matchAll(re)) {
    try {
      walk(JSON.parse(m[1].trim()), found);
    } catch {
      // JSON-LD quebrado: ignora esse bloco
    }
  }
  const events: SiteEvent[] = [];
  for (const e of found) {
    const name = str(e.name);
    const startDate = str(e.startDate);
    if (!name || !startDate) continue;
    const loc = asArray(e.location as Json | Json[]).find((l) => l && typeof l === "object") as Json | undefined;
    const addr = loc?.address;
    const address = (typeof addr === "object" && addr ? addr : {}) as Json;
    const offer = asArray(e.offers as Json | Json[])[0] as Json | undefined;
    const price = offer ? Number(offer.price ?? offer.lowPrice) : NaN;
    let url = str(e.url) ?? pageUrl;
    try {
      url = new URL(url, pageUrl).toString();
    } catch {
      url = pageUrl;
    }
    events.push({
      name,
      startDate,
      endDate: str(e.endDate),
      url,
      venueName: str(loc?.name),
      street: str(address.streetAddress) ?? (typeof addr === "string" ? addr : undefined),
      locality: str(address.addressLocality),
      isFree: e.isAccessibleForFree === true || e.isAccessibleForFree === "true" || price === 0,
      priceCents: Number.isFinite(price) && price > 0 ? Math.round(price * 100) : null,
      description: str(e.description)?.slice(0, 500),
    });
  }
  return events;
}

/** Links da página que contêm o trecho informado (mesmo site). */
export function extractLinks(html: string, pageUrl: string, pattern: string): string[] {
  const base = new URL(pageUrl);
  const out = new Set<string>();
  for (const m of html.matchAll(/href=["']([^"'#]+)["']/gi)) {
    try {
      const u = new URL(m[1], base);
      if (u.host === base.host && u.toString().includes(pattern) && u.toString() !== pageUrl) out.add(u.toString());
    } catch {
      // link inválido
    }
  }
  return [...out];
}

// ---------- classificação ----------

const SPORT_WORDS: [RegExp, string][] = [
  [/\b(jiu ?jitsu|bjj|jiu jitsu|grappling|no ?gi)\b/, "jiu-jitsu"],
  [/\b(mma|ufc|vale tudo|artes marciais mistas)\b/, "mma"],
  [/\bfutsal\b/, "futsal"],
  [/\b(basquete|basketball|nbb|3x3)\b/, "basquete"],
  [/\b(volei|volleyball|superliga)\b/, "volei"],
  [/\b(futebol|football|soccer|campeonato brasileiro|copa do brasil)\b/, "futebol"],
];

export function detectSport(text: string): string | null {
  const n = normalize(text);
  for (const [re, slug] of SPORT_WORDS) if (re.test(n)) return slug;
  return null;
}

/** "2026-11-22T15:00" sem fuso é tratado como horário de Brasília. */
function parseDate(s: string): Date | null {
  const withTz = /[zZ]|[+-]\d\d:?\d\d$/.test(s) ? s : /T\d/.test(s) ? `${s}-03:00` : `${s}T00:00:00-03:00`;
  const d = new Date(withTz);
  return Number.isNaN(d.getTime()) ? null : d;
}

// ---------- execução ----------

export type SiteResult = { url: string; pages: number; found: number; saved: number; note?: string };
export type CrawlSummary = { ok: boolean; message?: string; sites: SiteResult[] };

type Source = { id: number; url: string; link_pattern: string | null; sport_slug: string | null };

async function organizerFor(db: SupabaseClient, host: string): Promise<string> {
  const { data, error } = await db
    .from("organizers")
    .upsert({ source_key: `${SITE_SOURCE}:${host}`, name: host }, { onConflict: "source_key" })
    .select("id")
    .single();
  if (error) throw new Error(`organizador ${host}: ${error.message}`);
  return data!.id as string;
}

async function crawlSource(
  db: SupabaseClient,
  src: Source,
  ids: { cities: Map<string, number>; sports: Map<string, number> },
  deadline: number,
): Promise<SiteResult> {
  const result: SiteResult = { url: src.url, pages: 0, found: 0, saved: 0 };
  const events: SiteEvent[] = [];
  try {
    const html = await politeFetch(src.url, deadline);
    result.pages++;
    events.push(...extractEvents(html, src.url));

    if (src.link_pattern) {
      const links = extractLinks(html, src.url, src.link_pattern);
      const since = new Date(Date.now() - 86_400_000).toISOString();
      const { data: seen } = await db.from("crawl_pages").select("url").in("url", links.slice(0, 200)).gt("fetched_at", since);
      const seenSet = new Set((seen ?? []).map((r) => r.url as string));
      for (const link of links.filter((l) => !seenSet.has(l)).slice(0, PAGES_PER_SOURCE - 1)) {
        try {
          const page = await politeFetch(link, deadline);
          result.pages++;
          events.push(...extractEvents(page, link));
          await db.from("crawl_pages").upsert({ url: link, fetched_at: new Date().toISOString() });
        } catch (e) {
          if (e instanceof Skip) {
            result.note = e.message;
            break;
          }
        }
      }
    }
  } catch (e) {
    result.note = e instanceof Error ? e.message : String(e);
    return result;
  }

  result.found = events.length;
  const now = Date.now();
  const limit = now + LOOKAHEAD_DAYS * 86_400_000;
  const host = new URL(src.url).host;
  const rows: Record<string, unknown>[] = [];
  let organizerId: string | null = null;

  for (const ev of events) {
    const start = parseDate(ev.startDate);
    if (!start || start.getTime() > limit) continue;
    let end = ev.endDate ? parseDate(ev.endDate) : null;
    if (!end || end <= start) end = new Date(start.getTime() + 3 * 3_600_000);
    if (end.getTime() < now) continue;
    const citySlug = cityFromVenueCity(ev.locality);
    const sportSlug = detectSport(`${ev.name} ${ev.description ?? ""}`) ?? src.sport_slug;
    if (!citySlug || !sportSlug || !ids.cities.has(citySlug) || !ids.sports.has(sportSlug)) continue;
    const city = getCity(citySlug)!;
    organizerId ??= await organizerFor(db, host);
    rows.push({
      source: SITE_SOURCE,
      external_id: ev.url === src.url ? `${ev.url}#${normalize(ev.name)}|${start.toISOString()}` : ev.url,
      organizer_id: organizerId,
      city_id: ids.cities.get(citySlug)!,
      sport_id: ids.sports.get(sportSlug)!,
      title: ev.name.slice(0, 120),
      description: ev.description ?? null,
      venue_name: ev.venueName ?? UNKNOWN_VENUE,
      address: [ev.street, `${city.name} - ${city.uf}`].filter(Boolean).join(", "),
      starts_at: start.toISOString(),
      ends_at: end.toISOString(),
      is_free: !!ev.isFree,
      price_cents: ev.isFree ? null : ev.priceCents ?? null,
      ticket_url: ev.url,
      source_url: ev.url,
    });
  }

  if (rows.length) {
    // Não mexe no status de quem já existe (o admin pode ter aprovado ou recusado).
    const { data: existing } = await db
      .from("events")
      .select("external_id, status, rejection_reason")
      .eq("source", SITE_SOURCE)
      .in("external_id", rows.map((r) => r.external_id as string));
    const prev = new Map((existing ?? []).map((e) => [e.external_id as string, e]));
    for (const r of rows) {
      const p = prev.get(r.external_id as string);
      r.status = p?.status ?? "pending";
      r.rejection_reason = p?.rejection_reason ?? null;
    }
    const unique = [...new Map(rows.map((r) => [r.external_id as string, r])).values()];
    const { error } = await db.from("events").upsert(unique, { onConflict: "source,external_id" });
    if (error) result.note = `Erro ao salvar: ${error.message}`;
    else result.saved = unique.length;
  }
  return result;
}

/** Lê os sites cadastrados em crawl_sources e grava os eventos encontrados como pendentes. */
export async function runCrawl(trigger: "cron" | "admin"): Promise<CrawlSummary> {
  const db = getSupabaseAdmin();
  if (!db) return { ok: false, message: "Falta SUPABASE_SECRET_KEY nas variáveis de ambiente.", sites: [] };
  const keyProblem = checkSecretKey();
  if (keyProblem) return { ok: false, message: keyProblem, sites: [] };

  const deadline = Date.now() + TIME_BUDGET_MS;
  const { data: sources, error } = await db
    .from("crawl_sources")
    .select("id, url, link_pattern, sport_slug")
    .eq("enabled", true)
    .order("last_run_at", { ascending: true, nullsFirst: true });
  if (error)
    return { ok: false, message: `Rode supabase/migrations/0008_sites.sql no Supabase (${error.message}).`, sites: [] };

  const [{ data: cities }, { data: sports }] = await Promise.all([
    db.from("cities").select("id, slug"),
    db.from("sports").select("id, slug"),
  ]);
  const ids = {
    cities: new Map((cities ?? []).map((c) => [c.slug as string, c.id as number])),
    sports: new Map((sports ?? []).map((s) => [s.slug as string, s.id as number])),
  };

  const { data: run } = await db.from("import_runs").insert({ trigger: `sites-${trigger}` }).select("id").single();
  const sites: SiteResult[] = [];
  for (const src of (sources ?? []) as Source[]) {
    if (Date.now() > deadline) {
      sites.push({ url: src.url, pages: 0, found: 0, saved: 0, note: "sem tempo nesta execução; fica para a próxima" });
      continue;
    }
    const r = await crawlSource(db, src, ids, deadline);
    sites.push(r);
    await db
      .from("crawl_sources")
      .update({
        last_run_at: new Date().toISOString(),
        last_result: r.note ?? `${r.pages} página(s), ${r.found} evento(s) achado(s), ${r.saved} salvo(s)`,
      })
      .eq("id", src.id);
  }
  const summary: CrawlSummary = { ok: true, sites };
  if (run) await db.from("import_runs").update({ finished_at: new Date().toISOString(), ok: true, summary }).eq("id", run.id);
  return summary;
}
