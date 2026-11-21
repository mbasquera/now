import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCity } from "@/lib/cities";
import { getEvent } from "@/lib/data";
import { getSport } from "@/lib/sports";
import { UNKNOWN_VENUE, sourceDomain } from "@/lib/source";
import { formatDayLabel, formatPrice, formatTime, getLiveState, mapsLink, minutesUntil } from "@/lib/time";
import { LiveBadge } from "@/components/LiveBadge";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const event = await getEvent((await params).id);
  return { title: event ? `${event.title} – NOW` : "Evento – NOW", description: event?.description };
}

export default async function EventPage({ params }: Props) {
  const event = await getEvent((await params).id);
  if (!event) notFound();
  const city = getCity(event.citySlug);
  const tz = city?.timezone ?? "America/Sao_Paulo";
  const sport = getSport(event.sportSlug);
  const now = new Date();
  const state = getLiveState(event, now, tz);

  return (
    <article className="py-5">
      <Link href={city ? `/${city.slug}` : "/"} className="text-sm text-muted">
        ← {city ? `Eventos em ${city.name}` : "Voltar"}
      </Link>

      <div className="mt-4 flex aspect-[16/9] items-center justify-center overflow-hidden rounded-2xl bg-surface text-7xl">
        {event.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={event.imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          sport.emoji
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <LiveBadge state={state} minutes={minutesUntil(event.startsAt, now)} />
        {state === "ended" && <span className="rounded-full bg-line px-2.5 py-0.5 text-xs">Encerrado</span>}
        <span className="text-sm text-muted">
          {sport.emoji} {sport.name}
        </span>
      </div>
      <h1 className="mt-2 text-2xl font-black leading-tight">{event.title}</h1>

      <dl className="mt-5 grid gap-3 rounded-2xl border border-line bg-surface p-4 text-sm">
        <div>
          <dt className="text-muted">Quando</dt>
          <dd className="font-semibold">
            {formatDayLabel(event.startsAt, now, tz)}, {formatTime(event.startsAt, tz)} às {formatTime(event.endsAt, tz)}
            {city && <span className="font-normal text-muted"> (horário de {city.name})</span>}
          </dd>
        </div>
        <div>
          <dt className="text-muted">Onde</dt>
          <dd className="font-semibold">{event.venueName}</dd>
          <dd className="text-muted">{event.address}</dd>
        </div>
        <div>
          <dt className="text-muted">Entrada</dt>
          <dd className={`font-semibold ${event.isFree ? "text-accent" : ""}`}>{formatPrice(event)}</dd>
        </div>
      </dl>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {event.venueName === UNKNOWN_VENUE ? (
          <span className="rounded-xl border border-line px-4 py-3 text-center text-muted">Local a confirmar</span>
        ) : (
          <a
            href={mapsLink(event)}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl bg-accent px-4 py-3 text-center font-bold text-black"
          >
            Como chegar
          </a>
        )}
        {event.ticketUrl ? (
          <a
            href={event.ticketUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-line px-4 py-3 text-center font-bold"
          >
            Ingressos
          </a>
        ) : (
          <span className="rounded-xl border border-line px-4 py-3 text-center text-muted">
            {event.isFree ? "Entrada livre" : "Ingresso no local"}
          </span>
        )}
      </div>

      {event.description && (
        <section className="mt-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">Sobre</h2>
          <p className="mt-2 whitespace-pre-line leading-relaxed">{event.description}</p>
        </section>
      )}

      <section className="mt-6 rounded-2xl border border-line bg-surface p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">Fonte</h2>
        {event.source === "api-sports" ? (
          <p className="mt-1 text-sm">
            Importado automaticamente da API-Sports, que reúne os dados oficiais das competições ({event.organizerName}).
          </p>
        ) : (
          <p className="mt-1 text-sm">Divulgação do próprio organizador.</p>
        )}
        {event.sourceUrl ? (
          <a
            href={event.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-sm text-accent underline"
          >
            {event.source === "api-sports" ? "Conferir este jogo" : `Ver a divulgação (${sourceDomain(event.sourceUrl) ?? "link"})`}
          </a>
        ) : (
          <p className="mt-2 text-sm text-muted">Sem link de fonte.</p>
        )}
      </section>

      <section className="mt-6 rounded-2xl border border-line bg-surface p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">Organizador</h2>
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
    </article>
  );
}
