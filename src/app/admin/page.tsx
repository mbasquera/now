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
import { importNow, moderate } from "./actions";

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
  summary: ImportSummary | null;
};

const SPORT_LABEL: Record<string, string> = { futebol: "Futebol", basquete: "Basquete", volei: "Vôlei" };

const SELECT =
  "id, title, description, venue_name, address, starts_at, ends_at, is_free, price_cents, image_url, status, updated_at, sport:sports(slug), city:cities(slug), organizer:organizers(name, instagram, whatsapp)";

export default async function AdminPage() {
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
  const [{ data: pending }, { data: recent }, { data: runsData }] = await Promise.all([
    supabase.from("events").select(SELECT).eq("status", "pending").gt("ends_at", now.toISOString()).order("starts_at"),
    supabase.from("events").select(SELECT).neq("status", "pending").order("updated_at", { ascending: false }).limit(10),
    supabase.from("import_runs").select("id, started_at, trigger, ok, summary").order("started_at", { ascending: false }).limit(5),
  ]);
  const runs = (runsData ?? []) as ImportRun[];
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
                {formatPrice({ isFree: e.is_free, priceCents: e.price_cents } as SportEvent)}
              </p>
              <p className="text-sm text-muted">
                {e.venue_name} – {e.address}
              </p>
              {e.description && <p className="mt-2 whitespace-pre-line text-sm">{e.description}</p>}
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
          Todo dia às 6h (Brasília) o site busca na API-Sports os jogos de futebol, basquete e vôlei dos próximos 7 dias
          nas capitais. Eles entram já aprovados.
        </p>
        <form action={importNow} className="mt-3">
          <button className="rounded-xl border border-line px-4 py-2 font-semibold">Importar agora</button>
        </form>
        {runs.length === 0 && <p className="mt-3 text-muted">Nenhuma importação ainda.</p>}
        <ul className="mt-3 space-y-3">
          {runs.map((r) => (
            <li key={r.id} className="border-t border-line pt-3">
              <p className="font-semibold">
                <span className={r.ok ? "text-accent" : r.ok === false ? "text-live" : "text-muted"}>
                  {r.ok ? "OK" : r.ok === false ? "Com erros" : "Rodando…"}
                </span>{" "}
                · {formatDayLabel(r.started_at, now, "America/Sao_Paulo")}, {formatTime(r.started_at, "America/Sao_Paulo")} ·{" "}
                {r.trigger === "cron" ? "automática" : "manual"}
              </p>
              {r.summary?.message && <p className="text-live">{r.summary.message}</p>}
              {Object.entries(r.summary?.sports ?? {}).map(([sport, s]) => (
                <div key={sport}>
                  <p className="text-muted">
                    {SPORT_LABEL[sport] ?? sport}: {s.found} jogo(s) no Brasil, {s.inCapitals} em capitais, {s.saved} salvo(s)
                    {s.cancelled > 0 && `, ${s.cancelled} adiado(s)/cancelado(s)`}
                  </p>
                  {s.errors.slice(0, 3).map((err, i) => (
                    <p key={i} className="text-xs text-live">
                      {err}
                    </p>
                  ))}
                </div>
              ))}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
