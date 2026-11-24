import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCity } from "@/lib/cities";
import { getCityEvents } from "@/lib/data";
import { getSport } from "@/lib/sports";
import { getCompetition } from "@/lib/matchup";
import { dayKey, getLiveState } from "@/lib/time";
import type { LiveState, SportEvent } from "@/lib/types";
import { EventRow } from "@/components/EventRow";
import { LiveCard } from "@/components/LiveCard";
import { SportIcon } from "@/components/SportIcon";
import { DayTabs, PriceToggle, SportRail, type DayTab, type FilterState } from "@/components/Filters";
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

type Item = { event: SportEvent; state: LiveState; day: string };

const DAYS = 7;

export default async function CityPage({ params, searchParams }: Props) {
  const { cidade } = await params;
  const raw = await searchParams;
  const city = getCity(cidade);
  if (!city) notFound();
  const tz = city.timezone;
  const now = new Date();
  const today = dayKey(now, tz);

  // links antigos (?quando=agora|hoje) continuam funcionando
  const filters: FilterState = {
    ...raw,
    dia: raw.dia ?? (raw.quando === "agora" ? "agora" : raw.quando === "hoje" ? today : undefined),
  };

  const { events, problem } = await getCityEvents(city.slug, now);
  const all: Item[] = events
    .map((e) => ({ event: e, state: getLiveState(e, now, tz), day: dayKey(new Date(e.startsAt), tz) }))
    .filter((x) => x.state !== "ended");

  const bySport = (x: Item) => !filters.esporte || x.event.sportSlug === filters.esporte;
  const byPrice = (x: Item) =>
    filters.preco === "gratis" ? x.event.isFree : filters.preco === "pago" ? !x.event.isFree : true;
  const isNow = (x: Item) => x.state === "live" || x.state === "soon";
  const byDay = (x: Item) =>
    !filters.dia ? true : filters.dia === "agora" ? isNow(x) : x.day === filters.dia || (filters.dia === today && x.state === "live");

  // contagens: cada controle conta com os outros filtros aplicados
  const sportCounts = new Map<string, number>();
  const forSports = all.filter((x) => byPrice(x) && byDay(x));
  forSports.forEach((x) => sportCounts.set(x.event.sportSlug, (sportCounts.get(x.event.sportSlug) ?? 0) + 1));

  const forDays = all.filter((x) => bySport(x) && byPrice(x));
  const dayFmt = new Intl.DateTimeFormat("pt-BR", { timeZone: tz, weekday: "short" });
  const dateFmt = new Intl.DateTimeFormat("pt-BR", { timeZone: tz, day: "2-digit", month: "2-digit" });
  const liveCount = forDays.filter((x) => x.state === "live").length;
  const days: DayTab[] = [
    { key: "agora", label: "Agora", sub: liveCount ? `${liveCount} ao vivo` : `${forDays.filter(isNow).length} em 2h`, count: forDays.filter(isNow).length, live: liveCount > 0 },
    ...Array.from({ length: DAYS }, (_, i) => {
      const d = new Date(now.getTime() + i * 86_400_000);
      const key = dayKey(d, tz);
      const wd = dayFmt.format(d).replace(".", "");
      const count = forDays.filter((x) => x.day === key || (i === 0 && x.state === "live")).length;
      return {
        key,
        count,
        label: i === 0 ? "Hoje" : i === 1 ? "Amanhã" : wd.charAt(0).toUpperCase() + wd.slice(1),
        sub: `${dateFmt.format(d)} · ${count}`,
      };
    }),
  ];

  const list = all.filter((x) => bySport(x) && byPrice(x) && byDay(x));
  const live = list.filter((x) => x.state === "live");
  const highlights = live.length ? live : list.filter((x) => x.state === "soon");
  const rest = list.filter((x) => !highlights.includes(x));

  // agrupa por dia e, dentro do dia, por campeonato
  const groups: { day: string; comps: { name: string; sport: string; items: Item[] }[] }[] = [];
  for (const x of rest) {
    const day = x.state === "live" ? today : x.day;
    let g = groups.find((g) => g.day === day);
    if (!g) groups.push((g = { day, comps: [] }));
    const name = getCompetition(x.event);
    let c = g.comps.find((c) => c.name === name && c.sport === x.event.sportSlug);
    if (!c) g.comps.push((c = { name, sport: x.event.sportSlug, items: [] }));
    c.items.push(x);
  }
  const dayTitle = (key: string) => {
    const t = days.find((d) => d.key === key);
    if (!t) {
      // dia fora da faixa de abas (ex.: o 8º dia): formata a data mesmo assim
      const d = new Date(`${key}T12:00:00Z`);
      const wd = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC", weekday: "short" }).format(d).replace(".", "");
      const dm = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC", day: "2-digit", month: "2-digit" }).format(d);
      return `${wd.charAt(0).toUpperCase() + wd.slice(1)} ${dm}`;
    }
    const date = t.sub.split(" · ")[0];
    return t.label === "Hoje" || t.label === "Amanhã" ? `${t.label}, ${date}` : `${t.label} ${date}`;
  };

  const localTime = new Intl.DateTimeFormat("pt-BR", { timeZone: tz, hour: "2-digit", minute: "2-digit" }).format(now);
  const base = `/${city.slug}`;

  return (
    <div className="py-5">
      <RememberCity slug={city.slug} />

      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <Link href="/?trocar=1" className="group inline-flex items-center gap-1 text-sm text-muted hover:text-white">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />
              <circle cx="12" cy="9.5" r="2.5" />
            </svg>
            Trocar cidade
          </Link>
          <h1 className="truncate font-display text-4xl leading-none font-extrabold sm:text-5xl">
            {city.name} <span className="text-2xl font-bold text-muted">{city.uf}</span>
          </h1>
        </div>
        <div className="shrink-0 rounded-xl border border-line bg-surface px-3 py-1.5 text-right">
          <p className="text-[11px] leading-tight text-muted">Hora local</p>
          <p className="font-display text-2xl leading-none font-bold tabular-nums">{localTime}</p>
        </div>
      </div>

      <div className="mt-5">
        <SportRail base={base} current={filters} counts={sportCounts} total={forSports.length} />
      </div>

      <div className="mt-4">
        <DayTabs base={base} current={filters} days={days} />
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <p className="text-sm text-muted">
          {list.length} {list.length === 1 ? "evento" : "eventos"}
          {filters.esporte ? ` de ${getSport(filters.esporte).name.toLowerCase()}` : ""}
        </p>
        <PriceToggle base={base} current={filters} />
      </div>

      {problem && (
        <div className="mt-6 rounded-xl border border-accent/40 bg-accent/10 p-4 text-sm">
          <p className="font-semibold text-accent">Site em configuração</p>
          <p className="mt-1">{problem.hint}</p>
          <p className="mt-2 font-mono text-xs break-words text-muted">{problem.detail}</p>
        </div>
      )}

      {!problem && list.length === 0 && (
        <div className="mt-8 flex flex-col items-center rounded-2xl border border-dashed border-line px-6 py-10 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-raised text-muted">
            <SportIcon slug={filters.esporte ?? ""} className="h-7 w-7" />
          </span>
          <p className="mt-3 font-display text-xl font-bold">Nenhum evento com esses filtros</p>
          <p className="mt-1 max-w-sm text-sm text-muted">
            Tente outro dia ou esporte, ou{" "}
            <Link href={base} className="text-accent underline">
              limpe os filtros
            </Link>
            . Organiza eventos em {city.name}?{" "}
            <Link href="/painel" className="text-accent underline">
              Divulgue o seu
            </Link>
            .
          </p>
        </div>
      )}

      {highlights.length > 0 && (
        <section className="mt-6" aria-labelledby="destaques">
          <h2 id="destaques" className="mb-3 flex items-center gap-2 font-display text-2xl font-bold">
            {live.length ? (
              <>
                <span className="live-dot h-2.5 w-2.5 rounded-full bg-live" /> Ao vivo agora
              </>
            ) : (
              "Começa em breve"
            )}
            <span className="text-base font-semibold text-muted">{highlights.length}</span>
          </h2>
          <div className="rail -mx-4 flex gap-3 overflow-x-auto px-4 pb-2">
            {highlights.map(({ event, state }) => (
              <LiveCard key={event.id} event={event} state={state} now={now} timezone={tz} />
            ))}
          </div>
        </section>
      )}

      {groups.map((g) => (
        <section key={g.day} className="mt-7">
          <h2 className="mb-3 font-display text-2xl font-bold">{dayTitle(g.day)}</h2>
          <div className="space-y-3">
            {g.comps.map((c) => {
              const sport = getSport(c.sport);
              const logo = c.items.find((x) => x.event.leagueLogo)?.event.leagueLogo;
              return (
                <div key={c.name + c.sport} className="overflow-hidden rounded-xl border border-line bg-surface">
                  <div className="flex items-center gap-2 border-b border-line bg-raised/60 px-3 py-2">
                    {logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={logo} alt="" className="h-5 w-5 rounded-sm bg-white object-contain p-0.5" loading="lazy" />
                    ) : (
                      <span style={{ color: sport.color }}>
                        <SportIcon slug={sport.slug} className="h-4.5 w-4.5" />
                      </span>
                    )}
                    <span className="truncate text-sm font-bold">{c.name}</span>
                    <span className="ml-auto shrink-0 text-xs text-muted">
                      {c.name === sport.name ? c.items.length : `${sport.name} · ${c.items.length}`}
                    </span>
                  </div>
                  <div className="divide-y divide-line">
                    {c.items.map(({ event, state }) => (
                      <EventRow key={event.id} event={event} state={state} now={now} timezone={tz} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
