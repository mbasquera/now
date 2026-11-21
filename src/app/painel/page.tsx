import Link from "next/link";
import { redirect } from "next/navigation";
import { getCity } from "@/lib/cities";
import { getSport } from "@/lib/sports";
import { formatDayLabel, formatTime } from "@/lib/time";
import { isSupabaseConfigured } from "@/lib/supabase/public";
import { requireUser } from "@/lib/supabase/server";
import { SupabaseMissing } from "@/components/SupabaseMissing";
import { deleteEvent, signOut } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Meus eventos – NOW" };

type Row = {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  status: "pending" | "approved" | "rejected";
  rejection_reason: string | null;
  sport: { slug: string } | null;
  city: { slug: string } | null;
};

const STATUS = {
  pending: { label: "Aguardando aprovação", cls: "bg-yellow-400/15 text-yellow-300" },
  approved: { label: "Publicado", cls: "bg-accent/15 text-accent" },
  rejected: { label: "Recusado", cls: "bg-live/15 text-live" },
};

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ salvo?: string; excluido?: string }> }) {
  if (!isSupabaseConfigured)
    return (
      <div className="py-8">
        <h1 className="text-2xl font-black">Meus eventos</h1>
        <SupabaseMissing />
      </div>
    );

  const { supabase, user, organizer } = await requireUser();
  if (!organizer) redirect("/painel/perfil");
  const { salvo, excluido } = await searchParams;

  const { data } = await supabase
    .from("events")
    .select("id, title, starts_at, ends_at, status, rejection_reason, sport:sports(slug), city:cities(slug)")
    .eq("organizer_id", organizer.id)
    .order("starts_at", { ascending: false });
  const events = (data ?? []) as unknown as Row[];
  const now = new Date();

  return (
    <div className="py-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted">Olá,</p>
          <h1 className="text-2xl font-black">{organizer.name}</h1>
          <p className="text-xs text-muted">{user.email}</p>
        </div>
        <div className="flex flex-col items-end gap-1 text-sm">
          <Link href="/painel/perfil" className="text-accent underline">
            Editar perfil
          </Link>
          <form action={signOut}>
            <button className="text-muted underline">Sair</button>
          </form>
        </div>
      </div>

      {organizer.role === "admin" && (
        <Link
          href="/admin"
          className="mt-4 block rounded-2xl border border-accent/60 bg-surface p-4 hover:border-accent"
        >
          <p className="font-bold">Painel de admin →</p>
          <p className="text-sm text-muted">Aprovar eventos e rodar a importação automática de jogos.</p>
        </Link>
      )}

      {salvo && (
        <p className="mt-4 rounded-xl bg-accent/15 p-3 text-sm text-accent">
          Evento salvo! Ele aparece no site assim que for aprovado.
        </p>
      )}
      {excluido && <p className="mt-4 rounded-xl bg-line p-3 text-sm">Evento excluído.</p>}

      <Link
        href="/painel/eventos/novo"
        className="mt-6 block rounded-xl bg-accent px-4 py-3 text-center font-bold text-black"
      >
        + Cadastrar evento
      </Link>

      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wider text-muted">Meus eventos ({events.length})</h2>
      {events.length === 0 ? (
        <p className="mt-3 text-muted">Você ainda não cadastrou nenhum evento.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {events.map((e) => {
            const city = getCity(e.city?.slug ?? "");
            const tz = city?.timezone ?? "America/Sao_Paulo";
            const sport = getSport(e.sport?.slug ?? "");
            const ended = new Date(e.ends_at) <= now;
            const st = STATUS[e.status];
            return (
              <li key={e.id} className="rounded-2xl border border-line bg-surface p-3">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className={`rounded-full px-2 py-0.5 font-semibold ${st.cls}`}>{st.label}</span>
                  {ended && <span className="rounded-full bg-line px-2 py-0.5">Encerrado</span>}
                  <span className="text-muted">
                    {sport.emoji} {sport.name} · {city?.name}
                  </span>
                </div>
                <p className="mt-1 font-bold">{e.title}</p>
                <p className="text-sm text-muted">
                  {formatDayLabel(e.starts_at, now, tz)}, {formatTime(e.starts_at, tz)}
                </p>
                {e.status === "rejected" && e.rejection_reason && (
                  <p className="mt-1 text-sm text-live">Motivo: {e.rejection_reason}</p>
                )}
                <div className="mt-2 flex gap-4 text-sm">
                  {e.status === "approved" && (
                    <Link href={`/evento/${e.id}`} className="underline">
                      Ver no site
                    </Link>
                  )}
                  <Link href={`/painel/eventos/${e.id}`} className="text-accent underline">
                    Editar
                  </Link>
                  <form action={deleteEvent}>
                    <input type="hidden" name="id" value={e.id} />
                    <button className="text-live underline">Excluir</button>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
