import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCity } from "@/lib/cities";
import { getCityEvents } from "@/lib/data";
import { getLiveState } from "@/lib/time";
import type { LiveState, SportEvent } from "@/lib/types";
import { EventCard } from "@/components/EventCard";
import { Filters, type FilterState } from "@/components/Filters";
import { RememberCity } from "@/components/RememberCity";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ cidade: string }>;
  searchParams: Promise<FilterState>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const city = getCity((await params).cidade);
  return { title: city ? `Esporte ao vivo em ${city.name} – NOW` : "NOW" };
}

const SECTIONS: { state: LiveState; title: string }[] = [
  { state: "live", title: "🔴 Ao vivo agora" },
  { state: "soon", title: "Começa em breve" },
  { state: "later_today", title: "Hoje mais tarde" },
  { state: "upcoming", title: "Próximos dias" },
];

export default async function CityPage({ params, searchParams }: Props) {
  const { cidade } = await params;
  const filters = await searchParams;
  const city = getCity(cidade);
  if (!city) notFound();

  const now = new Date();
  const { events, problem } = await getCityEvents(city.slug, now);

  const withState = events
    .map((e) => ({ event: e, state: getLiveState(e, now, city.timezone) }))
    .filter(({ event, state }: { event: SportEvent; state: LiveState }) => {
      if (state === "ended") return false;
      if (filters.esporte && event.sportSlug !== filters.esporte) return false;
      if (filters.preco === "gratis" && !event.isFree) return false;
      if (filters.preco === "pago" && event.isFree) return false;
      if (filters.quando === "agora" && state !== "live" && state !== "soon") return false;
      if (filters.quando === "hoje" && state === "upcoming") return false;
      return true;
    });

  const localTime = new Intl.DateTimeFormat("pt-BR", {
    timeZone: city.timezone,
    hour: "2-digit",
    minute: "2-digit",
  }).format(now);

  return (
    <div className="py-5">
      <RememberCity slug={city.slug} />
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted">Agora em</p>
          <h1 className="text-2xl font-black">
            {city.name} <span className="text-base font-normal text-muted">{city.uf}</span>
          </h1>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black tabular-nums">{localTime}</p>
          <Link href="/?trocar=1" className="text-xs text-accent underline">
            trocar cidade
          </Link>
        </div>
      </div>

      <div className="mt-4">
        <Filters base={`/${city.slug}`} current={filters} />
      </div>

      {problem && (
        <div className="mt-6 rounded-2xl border border-yellow-400/40 bg-yellow-400/10 p-4 text-sm">
          <p className="font-semibold text-yellow-300">⚠️ Site em configuração</p>
          <p className="mt-1">{problem.hint}</p>
          <p className="mt-2 break-words font-mono text-xs text-muted">{problem.detail}</p>
        </div>
      )}

      {problem ? null : withState.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-line p-8 text-center">
          <p className="text-4xl">🏟️</p>
          <p className="mt-2 font-semibold">Nada por aqui com esses filtros.</p>
          <p className="mt-1 text-sm text-muted">Tente outro esporte ou horário. Organiza eventos? <Link href="/painel" className="text-accent underline">Cadastre o seu</Link>.</p>
        </div>
      ) : (
        SECTIONS.map(({ state, title }) => {
          const items = withState.filter((x) => x.state === state);
          if (!items.length) return null;
          return (
            <section key={state} className="mt-6">
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted">
                {title} <span className="text-white/40">({items.length})</span>
              </h2>
              <div className="space-y-2">
                {items.map(({ event, state }) => (
                  <EventCard key={event.id} event={event} state={state} now={now} timezone={city.timezone} />
                ))}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}
