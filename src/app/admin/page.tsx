import Link from "next/link";
import { redirect } from "next/navigation";
import { getCity } from "@/lib/cities";
import { getSport } from "@/lib/sports";
import { formatDayLabel, formatPrice, formatTime } from "@/lib/time";
import { isSupabaseConfigured } from "@/lib/supabase/public";
import { requireUser } from "@/lib/supabase/server";
import { SupabaseMissing } from "@/components/SupabaseMissing";
import type { SportEvent } from "@/lib/types";
import type { ImportSummary } from "@/lib/ingest/run";
import type { CrawlSummary } from "@/lib/ingest/crawler";
import { SPORTS } from "@/lib/sports";
import { addSite, crawlNow, importNow, moderate, removeSite } from "./actions";
import { ImportButton } from "./ImportButton";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // o botão "Importar agora" roda a importação aqui
export const metadata = { title: "Moderação – NOW" };

type Row = {
  id: string;
  title: string;
  description: string | null;
  venue_name: string;
  address: string;
  starts_at: string;
  ends_at: string;
  is_free: boolean;
  price_cents: number | null;
  image_url: string | null;
  source_url: string | null;
  source: string | null;
  status: SportEvent["status"];
  updated_at: string;
  sport: { slug: string } | null;
  city: { slug: string } | null;
  organizer: { name: string; instagram: string | null; whatsapp: string | null } | null;
};

type ImportRun = {
  id: number;
  started_at: string;
  trigger: string;
  ok: boolean | null;
  summary: (ImportSummary & Partial<CrawlSummary>) | null;
};

type Site = { id: number; url: string; link_pattern: string | null; sport_slug: string | null; last_run_at: string | null; last_result: string | null };

const SPORT_LABEL: Record<string, string> = { futebol: "Futebol", basquete: "Basquete", volei: "Vôlei" };

const SELECT =
  "id, title, description, venue_name, address, starts_at, ends_at, is_free, price_cents, image_url, source_url, source, status, updated_at, sport:sports(slug), city:cities(slug), organizer:organizers(name, instagram, whatsapp)";

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ importacao?: string; sites?: string }> }) {
  if (!isSupabaseConfigured)
    return (
      <div className="py-8">
        <h1 className="text-2xl font-black">Moderação</h1>
        <SupabaseMissing />
      </div>
    );

  const { supabase, organizer } = await requireUser("/admin");
  if (organizer?.role !== "admin") redirect("/painel");

  const now = new Date();
  const { importacao, sites: sitesMsg } = await searchParams;
  const [{ data: pending }, { data: recent }, { data: runsData, error: runsError }, { data: sitesData, error: sitesError }] = await Promise.all([
    supabase.from("events").select(SELECT).eq("status", "pending").gt("ends_at", now.toISOString()).order("starts_at"),
    supabase.from("events").select(SELECT).neq("status", "pending").order("updated_at", { ascending: false }).limit(10),
    supabase.from("import_runs").select("id, started_at, trigger, ok, summary").order("started_at", { ascending: false }).limit(6),
    supabase.from("crawl_sources").select("id, url, link_pattern, sport_slug, last_run_at, last_result").order("created_at"),
  ]);
  const runs = (runsData ?? []) as ImportRun[];
  const siteList = (sitesData ?? []) as Site[];
  const queue = (pending ?? []) as unknown as Row[];
  const done = (recent ?? []) as unknown as Row[];

  return (
    <div className="py-6">
      <Link href="/painel" className="text-sm text-muted">
        ← Painel
      </Link>
      <h1 className="mt-2 text-2xl font-black">Moderação</h1>
      <p className="text-sm text-muted">{queue.length} evento(s) aguardando aprovação.</p>

      <div className="mt-4 space-y-3">
        {queue.map((e) => {
          const city = getCity(e.city?.slug ?? "");
          const tz = city?.timezone ?? "America/Sao_Paulo";
          const sport = getSport(e.sport?.slug ?? "");
          return (
            <article key={e.id} className="rounded-2xl border border-line bg-surface p-4">
              {e.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={e.image_url} alt="" className="mb-3 h-36 w-full rounded-xl object-cover" />
              )}
              <p className="text-xs text-muted">
                {sport.emoji} {sport.name} · {city?.name}
              </p>
              <h2 className="font-bold">{e.title}</h2>
              <p className="text-sm">
                {formatDayLabel(e.starts_at, now, tz)}, {formatTime(e.starts_at, tz)}–{formatTime(e.ends_at, tz)} ·{" "}
                {formatPrice({ isFree: e.is_free, priceCents: e.price_cents, source: e.source } as SportEvent)}
              </p>
              <p className="text-sm text-muted">
                {e.venue_name} – {e.address}
              </p>
              {e.description && <p className="mt-2 whitespace-pre-line text-sm">{e.description}</p>}
              <p className="mt-2 text-sm">
                Fonte:{" "}
                {e.source_url ? (
                  <a href={e.source_url} target="_blank" rel="noopener noreferrer" className="text-accent underline">
                    {e.source_url}
                  </a>
                ) : (
                  <span className="text-live">sem link (confira antes de aprovar)</span>
                )}
              </p>
              <p className="mt-2 text-xs text-muted">
                Organizador: {e.organizer?.name}
                {e.organizer?.instagram && ` · @${e.organizer.instagram}`}
                {e.organizer?.whatsapp && ` · ${e.organizer.whatsapp}`}
              </p>
              <div className="mt-3 flex flex-col gap-2">
                <form action={moderate}>
                  <input type="hidden" name="id" value={e.id} />
                  <input type="hidden" name="decision" value="approve" />
                  <button className="w-full rounded-xl bg-accent px-4 py-2.5 font-bold text-black">Aprovar</button>
                </form>
                <form action={moderate} className="flex gap-2">
                  <input type="hidden" name="id" value={e.id} />
                  <input type="hidden" name="decision" value="reject" />
                  <input
                    name="reason"
                    placeholder="Motivo da recusa (opcional)"
                    className="min-w-0 flex-1 rounded-xl border border-line bg-bg px-3 py-2 text-sm"
                  />
                  <button className="rounded-xl border border-live px-4 py-2 text-sm font-semibold text-live">Recusar</button>
                </form>
              </div>
            </article>
          );
        })}
        {queue.length === 0 && <p className="rounded-2xl border border-dashed border-line p-6 text-center text-muted">Nada pendente. 🎉</p>}
      </div>

      {done.length > 0 && (
        <>
          <h2 className="mt-8 text-sm font-semibold uppercase tracking-wider text-muted">Decididos recentemente</h2>
          <ul className="mt-2 divide-y divide-line rounded-2xl border border-line bg-surface text-sm">
            {done.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-2 px-4 py-2.5">
                <span className="truncate">{e.title}</span>
                <span className={e.status === "approved" ? "text-accent" : "text-live"}>
                  {e.status === "approved" ? "Aprovado" : "Recusado"}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wider text-muted">Importação automática</h2>
      <div className="mt-2 rounded-2xl border border-line bg-surface p-4 text-sm">
        <p className="text-muted">
          Todo dia às 6h (Brasília) o site busca na API-Sports os jogos de futebol, basquete e vôlei nas capitais. No
          plano grátis a API só libera até depois de amanhã; num plano pago, busca os próximos 7 dias. Os jogos entram já
          aprovados.
        </p>
        <form action={importNow} className="mt-3">
          <ImportButton />
        </form>
        {importacao === "ok" && (
          <p className="mt-3 rounded-xl bg-accent/15 p-3 text-accent">Importação concluída. Veja o resultado abaixo.</p>
        )}
        {importacao && importacao !== "ok" && <p className="mt-3 rounded-xl bg-live/15 p-3 text-live">{importacao}</p>}
        {runsError && (
          <p className="mt-3 rounded-xl bg-live/15 p-3 text-live">
            Não consegui ler o histórico de importações ({runsError.message}). Rode supabase/migrations/0005_permissoes.sql (e o 0003/0004, se ainda não rodou) no
            SQL Editor do Supabase.
          </p>
        )}
        {!runsError && runs.length === 0 && <p className="mt-3 text-muted">Nenhuma importação ainda.</p>}
        <ul className="mt-3 space-y-3">
          {runs.map((r) => (
            <li key={r.id} className="border-t border-line pt-3">
              <p className="font-semibold">
                <span className={r.ok ? "text-accent" : r.ok === false ? "text-live" : "text-muted"}>
                  {r.ok ? "OK" : r.ok === false ? "Com erros" : "Rodando…"}
                </span>{" "}
                · {formatDayLabel(r.started_at, now, "America/Sao_Paulo")}, {formatTime(r.started_at, "America/Sao_Paulo")} ·{" "}
                {r.trigger.startsWith("sites") ? "sites · " : "API · "}
                {r.trigger.endsWith("cron") ? "automática" : "manual"}
              </p>
              {r.summary?.message && <p className="text-live">{r.summary.message}</p>}
              {Object.entries(r.summary?.sports ?? {}).map(([sport, s]) => (
                <div key={sport}>
                  <p className="text-muted">
                    {SPORT_LABEL[sport] ?? sport}: {s.found} jogo(s) no Brasil, {s.inCapitals} em capitais, {s.saved} salvo(s)
                    {s.cancelled > 0 && `, ${s.cancelled} adiado(s)/cancelado(s)`}
                    {!!s.enriched && ` · ${s.enriched} com local completado pelo estádio do mandante`}
                    {!!s.skippedDays && ` · ${s.skippedDays} dia(s) fora do plano grátis`}
                  </p>
                  {s.errors.slice(0, 3).map((err, i) => (
                    <p key={i} className="text-xs text-live">
                      {err}
                    </p>
                  ))}
                </div>
              ))}
              {(r.summary?.sites ?? []).map((st) => (
                <p key={st.url} className="truncate text-muted">
                  {st.url}: {st.note ?? `${st.pages} página(s), ${st.found} evento(s), ${st.saved} salvo(s) como pendentes`}
                </p>
              ))}
            </li>
          ))}
        </ul>
      </div>

      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wider text-muted">Sites lidos pelo robô</h2>
      <div className="mt-2 rounded-2xl border border-line bg-surface p-4 text-sm">
        <p className="text-muted">
          Todo dia às 6h30 o robô lê as páginas abaixo, devagar e só se o robots.txt do site permitir. Ele só entende eventos
          publicados no padrão schema.org (o mesmo que o Google usa). Os eventos encontrados entram como <b>pendentes</b> na
          fila acima, com o link da página como fonte, para você conferir.
        </p>
        <form action={crawlNow} className="mt-3">
          <ImportButton label="Ler sites agora" />
        </form>
        {sitesMsg === "sites-ok" && (
          <p className="mt-3 rounded-xl bg-accent/15 p-3 text-accent">Leitura concluída. Veja o resultado no histórico acima.</p>
        )}
        {sitesMsg === "site-adicionado" && <p className="mt-3 rounded-xl bg-accent/15 p-3 text-accent">Site adicionado.</p>}
        {sitesMsg && !["sites-ok", "site-adicionado"].includes(sitesMsg) && (
          <p className="mt-3 rounded-xl bg-live/15 p-3 text-live">{sitesMsg}</p>
        )}
        {sitesError && (
          <p className="mt-3 rounded-xl bg-live/15 p-3 text-live">
            Rode supabase/migrations/0007_estadios.sql e 0008_sites.sql no SQL Editor do Supabase ({sitesError.message}).
          </p>
        )}
        <ul className="mt-3 space-y-2">
          {siteList.map((st) => (
            <li key={st.id} className="flex items-start justify-between gap-2 border-t border-line pt-2">
              <div className="min-w-0">
                <a href={st.url} target="_blank" rel="noopener noreferrer" className="block truncate text-accent underline">
                  {st.url}
                </a>
                <p className="text-xs text-muted">
                  {st.link_pattern && `segue links com "${st.link_pattern}" · `}
                  {st.sport_slug && `esporte padrão: ${st.sport_slug} · `}
                  {st.last_result ?? "ainda não lido"}
                </p>
              </div>
              <form action={removeSite}>
                <input type="hidden" name="id" value={st.id} />
                <button className="text-xs text-live underline">Remover</button>
              </form>
            </li>
          ))}
        </ul>
        <form action={addSite} className="mt-4 grid gap-2">
          <input name="url" type="url" required placeholder="https://site.com.br/eventos/esportes" className="rounded-xl border border-line bg-bg px-3 py-2" />
          <div className="grid grid-cols-2 gap-2">
            <input name="link_pattern" placeholder='Seguir links com (ex.: "/evento/")' className="min-w-0 rounded-xl border border-line bg-bg px-3 py-2" />
            <select name="sport_slug" defaultValue="" className="rounded-xl border border-line bg-bg px-3 py-2">
              <option value="">Esporte: detectar</option>
              {SPORTS.map((sp) => (
                <option key={sp.slug} value={sp.slug}>
                  {sp.name}
                </option>
              ))}
            </select>
          </div>
          <button className="rounded-xl border border-line px-4 py-2 font-semibold">Adicionar site</button>
        </form>
      </div>
    </div>
  );
}
