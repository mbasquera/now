import Link from "next/link";
import type { LiveState, SportEvent } from "@/lib/types";
import { getSport } from "@/lib/sports";
import { getMatchup } from "@/lib/matchup";
import { UNKNOWN_VENUE, isImported } from "@/lib/source";
import { formatPrice, formatStart, formatTime, minutesUntil } from "@/lib/time";
import { Crest } from "./Crest";
import { SportIcon } from "./SportIcon";

function TimeCell({ event, state, now, timezone }: { event: SportEvent; state: LiveState; now: Date; timezone: string }) {
  if (state === "live")
    return (
      <>
        <span className="flex items-center gap-1 font-display text-sm font-bold text-live">
          <span className="live-dot h-1.5 w-1.5 rounded-full bg-live" />
          AO VIVO
        </span>
        <span className="text-[11px] text-muted">desde {formatTime(event.startsAt, timezone)}</span>
      </>
    );
  const min = minutesUntil(event.startsAt, now);
  return (
    <>
      <span className="font-display text-lg leading-none font-bold tabular-nums">{formatStart(event, timezone)}</span>
      {state === "soon" && <span className="mt-1 text-[11px] font-semibold text-accent">em {min < 60 ? `${min} min` : `${Math.floor(min / 60)}h${String(min % 60).padStart(2, "0")}`}</span>}
    </>
  );
}

/** Linha compacta da lista: horário | confronto com escudos (ou nome do evento) | preço. */
export function EventRow({
  event,
  state,
  now,
  timezone,
}: {
  event: SportEvent;
  state: LiveState;
  now: Date;
  timezone: string;
}) {
  const sport = getSport(event.sportSlug);
  const match = getMatchup(event);
  const venue = event.venueName === UNKNOWN_VENUE ? "Local a confirmar" : event.venueName;
  const price = formatPrice(event);
  return (
    <Link
      href={`/evento/${event.id}`}
      className={`grid grid-cols-[64px_1fr_auto] items-center gap-3 px-3 py-3 transition-colors hover:bg-raised ${
        state === "live" ? "bg-live/[0.06]" : ""
      }`}
    >
      <div className="flex flex-col items-center justify-center border-r border-line pr-3 text-center">
        <TimeCell event={event} state={state} now={now} timezone={timezone} />
      </div>
      <div className="min-w-0">
        {match ? (
          <div className="space-y-1">
            {[match.home, match.away].map((t, i) => (
              <div key={i} className="flex items-center gap-2">
                <Crest team={t} size={20} />
                <span className="truncate font-semibold">{t.name}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
              style={{ background: `${sport.color}22`, color: sport.color }}
            >
              <SportIcon slug={sport.slug} className="h-5 w-5" />
            </span>
            <span className="line-clamp-2 leading-snug font-semibold">{event.title}</span>
          </div>
        )}
        <p className="mt-1 flex items-center gap-1 truncate text-xs text-muted">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />
            <circle cx="12" cy="9.5" r="2.5" />
          </svg>
          <span className="truncate">{venue}</span>
        </p>
      </div>
      <div className="flex flex-col items-end gap-1 text-right">
        <span
          className={`rounded-md px-2 py-0.5 text-xs font-semibold whitespace-nowrap ${
            event.isFree
              ? "bg-grass/15 text-grass"
              : event.priceCents
                ? "bg-white/8 text-white"
                : "text-muted"
          }`}
        >
          {event.isFree ? "Grátis" : event.priceCents ? price : isImported(event.source) ? "Preço n/i" : "Pago"}
        </span>
        <svg viewBox="0 0 24 24" className="h-4 w-4 text-muted" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M9 6l6 6-6 6" />
        </svg>
      </div>
    </Link>
  );
}
