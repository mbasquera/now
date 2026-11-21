import Link from "next/link";
import type { LiveState, SportEvent } from "@/lib/types";
import { getSport } from "@/lib/sports";
import { formatDayLabel, formatPrice, formatTime, minutesUntil } from "@/lib/time";
import { LiveBadge } from "./LiveBadge";
import { sourceLabel } from "@/lib/source";

export function EventCard({
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
  return (
    <Link
      href={`/evento/${event.id}`}
      className={`flex gap-3 rounded-2xl border bg-surface p-3 transition hover:border-accent ${
        state === "live" ? "border-live/60" : "border-line"
      }`}
    >
      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-line text-3xl">
        {event.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={event.imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          sport.emoji
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <LiveBadge state={state} minutes={minutesUntil(event.startsAt, now)} />
          <span className="text-xs text-muted">{sport.name}</span>
        </div>
        <h3 className="mt-1 truncate font-bold">{event.title}</h3>
        <p className="truncate text-sm text-muted">{event.venueName}</p>
        <p className="mt-0.5 text-sm">
          {state === "live"
            ? `até ${formatTime(event.endsAt, timezone)}`
            : `${formatDayLabel(event.startsAt, now, timezone)}, ${formatTime(event.startsAt, timezone)}`}
          <span className="text-muted"> · </span>
          <span className={event.isFree ? "text-accent" : ""}>{formatPrice(event)}</span>
        </p>
        {sourceLabel(event) && <p className="mt-0.5 truncate text-xs text-muted">Fonte: {sourceLabel(event)}</p>}
      </div>
    </Link>
  );
}
