import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCity } from "@/lib/cities";
import { getEvent } from "@/lib/data";
import { SPORT_PHOTOS, getSport } from "@/lib/sports";
import { getMatchup } from "@/lib/matchup";
import { UNKNOWN_VENUE, isImported, sourceDomain } from "@/lib/source";
import { formatDayLabel, formatPrice, formatStart, formatTime, getLiveState, isTimeTbc, mapsLink, minutesUntil } from "@/lib/time";
import { LiveBadge } from "@/components/LiveBadge";
import { Crest } from "@/components/Crest";
import { SportCover } from "@/components/SportCover";
import { SportIcon } from "@/components/SportIcon";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const event = await getEvent((await params).id);
  return { title: event ? `${event.title} – NOW` : "Evento – NOW", description: event?.description };
}

const ICONS = {
  when: <path d="M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" />,
  where: (
    <>
      <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </>
  ),
  ticket: <path d="M3 8a2 2 0 0 0 0 4v0a2 2 0 0 1 0 4v2h18v-2a2 2 0 0 1 0-4v0a2 2 0 0 0 0-4V6H3zM14 6v12" />,
};

function InfoRow({ icon, label, children }: { icon: keyof typeof ICONS; label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 p-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-raised text-accent">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden>
          {ICONS[icon]}
        </svg>
      </span>
      <div className="min-w-0">
        <dt className="text-xs text-muted">{label}</dt>
        {children}
      </div>
    </div>
  );
}

export default async function EventPage({ params }: Props) {
  const event = await getEvent((await params).id);
  if (!event) notFound();
  const city = getCity(event.citySlug);
  const tz = city?.timezone ?? "America/Sao_Paulo";
  const sport = getSport(event.sportSlug);
  const now = new Date();
  const state = getLiveState(event, now, tz);
  const match = getMatchup(event);
  const photo = event.imageUrl ? null : SPORT_PHOTOS[event.sportSlug];

  const imported = isImported(event.source);
  return (
    <article className="pb-4">
      <div className="relative -mx-4 sm:mx-0 sm:mt-4">
        <SportCover
          sportSlug={event.sportSlug}
          imageUrl={event.imageUrl}
          width={1400}
          priority
          className="h-64 sm:h-80 sm:rounded-3xl"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/60 to-bg/10 sm:rounded-3xl" />
        <Link
          href={city ? `/${city.slug}` : "/"}
          className="absolute top-3 left-4 inline-flex items-center gap-1 rounded-lg bg-black/50 px-2.5 py-1.5 text-sm font-semibold backdrop-blur hover:bg-black/70"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M15 6l-6 6 6 6" />
          </svg>
          {city ? city.name : "Voltar"}
        </Link>
        {photo && (
          <a
            href={`${photo.page}?utm_source=now&utm_medium=referral`}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute top-3 right-4 rounded bg-black/40 px-1.5 py-0.5 text-[10px] text-white/70 hover:text-white"
          >
            Foto: {photo.author} / Unsplash
          </a>
        )}
        <div className="absolute inset-x-4 bottom-4 sm:inset-x-8">
          <div className="flex flex-wrap items-center gap-2">
            <LiveBadge state={state} minutes={minutesUntil(event.startsAt, now)} />
            {state === "ended" && <span className="rounded-md bg-line px-2 py-0.5 text-xs font-semibold">Encerrado</span>}
            <span className="inline-flex items-center gap-1 rounded-md bg-black/50 px-2 py-0.5 text-xs font-semibold backdrop-blur">
              <span style={{ color: sport.color }}>
                <SportIcon slug={sport.slug} className="h-3.5 w-3.5" />
              </span>
              {sport.name}
              {imported && ` · ${event.organizerName}`}
            </span>
          </div>
          {!match && <h1 className="mt-2 font-display text-4xl leading-none font-extrabold">{event.title}</h1>}
        </div>
      </div>

      {match && (
        <div className="relative z-10 mx-auto -mt-2 grid max-w-xl grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-2xl border border-line bg-surface p-5">
          <h1 className="sr-only">{event.title}</h1>
          <div className="flex flex-col items-center gap-2 text-center">
            <Crest team={match.home} size={64} />
            <span className="font-display text-xl leading-tight font-bold">{match.home.name}</span>
          </div>
          <div className="text-center">
            {state === "live" ? (
              <span className="font-display text-lg font-bold text-live">em jogo</span>
            ) : (
              <span className="font-display text-3xl font-bold tabular-nums">{formatStart(event, tz)}</span>
            )}
            <p className="text-xs text-muted">{formatDayLabel(event.startsAt, now, tz)}</p>
          </div>
          <div className="flex flex-col items-center gap-2 text-center">
            <Crest team={match.away} size={64} />
            <span className="font-display text-xl leading-tight font-bold">{match.away.name}</span>
          </div>
        </div>
      )}

      <div className="mx-auto mt-5 max-w-xl">
        {/* jogos importados: a fonte só informa o início (o fim é estimado) e não informa preço */}
        <dl className="divide-y divide-line rounded-2xl border border-line bg-surface">
          <InfoRow icon="when" label="Quando">
            <dd className="font-semibold">
              {formatDayLabel(event.startsAt, now, tz)},{" "}
              {isTimeTbc(event, tz)
                ? "horário a confirmar"
                : imported
                ? `início às ${formatTime(event.startsAt, tz)}`
                : `${formatTime(event.startsAt, tz)} às ${formatTime(event.endsAt, tz)}`}
            </dd>
            {city && <dd className="text-sm text-muted">Horário de {city.name}</dd>}
          </InfoRow>
          <InfoRow icon="where" label="Onde">
            <dd className="font-semibold">{event.venueName}</dd>
            <dd className="text-sm text-muted">{event.address}</dd>
          </InfoRow>
          <InfoRow icon="ticket" label="Entrada">
            <dd className={`font-semibold ${event.isFree ? "text-grass" : ""}`}>{formatPrice(event)}</dd>
          </InfoRow>
        </dl>

        <div className="mt-3 grid grid-cols-2 gap-2">
          {event.venueName === UNKNOWN_VENUE ? (
            <span className="rounded-xl border border-line px-4 py-3 text-center text-muted">Local a confirmar</span>
          ) : (
            <a
              href={mapsLink(event)}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl bg-accent px-4 py-3 text-center font-bold text-ink hover:brightness-110"
            >
              Como chegar
            </a>
          )}
          {event.ticketUrl ? (
            <a
              href={event.ticketUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-line bg-surface px-4 py-3 text-center font-bold hover:border-white/40"
            >
              Comprar ingresso
            </a>
          ) : (
            <span className="rounded-xl border border-line px-4 py-3 text-center text-sm text-muted">
              {event.isFree ? "Entrada livre" : imported ? "Ingresso: consulte o clube" : "Ingresso no local"}
            </span>
          )}
        </div>

        {event.description && (
          <section className="mt-6">
            <h2 className="font-display text-xl font-bold">Sobre</h2>
            <p className="mt-1 leading-relaxed whitespace-pre-line text-white/85">{event.description}</p>
          </section>
        )}

        <section className="mt-6 rounded-2xl border border-line bg-surface p-4">
          <h2 className="font-display text-xl font-bold">Fonte</h2>
          {event.source === "api-sports" ? (
            <p className="mt-1 text-sm text-white/85">
              Importado automaticamente da API-Sports, que reúne os dados oficiais das competições ({event.organizerName}).
            </p>
          ) : imported ? (
            <p className="mt-1 text-sm text-white/85">
              Importado automaticamente da agenda oficial publicada em {sourceDomain(event.sourceUrl) ?? "site da competição"}.
            </p>
          ) : (
            <p className="mt-1 text-sm text-white/85">Divulgação do próprio organizador.</p>
          )}
          {event.sourceUrl ? (
            <a
              href={event.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-sm font-semibold text-accent underline"
            >
              {event.source === "api-sports"
                ? "Conferir este jogo"
                : `${imported ? "Ver na agenda oficial" : "Ver a divulgação"} (${sourceDomain(event.sourceUrl) ?? "link"})`}
            </a>
          ) : (
            <p className="mt-2 text-sm text-muted">Sem link de fonte.</p>
          )}
        </section>

        {!imported && (
          <section className="mt-3 rounded-2xl border border-line bg-surface p-4">
            <h2 className="font-display text-xl font-bold">Organizador</h2>
            <p className="mt-1 font-semibold">{event.organizerName}</p>
            <div className="mt-2 flex flex-wrap gap-3 text-sm">
              {event.organizerInstagram && (
                <a
                  href={`https://instagram.com/${event.organizerInstagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent underline"
                >
                  @{event.organizerInstagram}
                </a>
              )}
              {event.organizerWhatsapp && (
                <a
                  href={`https://wa.me/${event.organizerWhatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent underline"
                >
                  WhatsApp
                </a>
              )}
            </div>
          </section>
        )}
      </div>
    </article>
  );
}
