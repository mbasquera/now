import Link from "next/link";
import type { LiveState, SportEvent } from "@/lib/types";
import { getSport } from "@/lib/sports";
import { getMatchup } from "@/lib/matchup";
import { UNKNOWN_VENUE } from "@/lib/source";
import { formatTime, isTimeTbc, minutesUntil } from "@/lib/time";
import { Crest } from "./Crest";
import { LiveBadge } from "./LiveBadge";
import { SportCover } from "./SportCover";
import { SportIcon } from "./SportIcon";

/** Card grande do destaque "Ao vivo agora": capa com foto, selo ao vivo e o confronto. */
export function LiveCard({
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
  return (
    <Link
      href={`/evento/${event.id}`}
      className="group relative flex h-56 w-[280px] shrink-0 flex-col justify-end overflow-hidden rounded-2xl border border-line sm:w-[320px]"
    >
      <SportCover sportSlug={event.sportSlug} imageUrl={event.imageUrl} width={640} className="absolute inset-0" />
      <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/75 to-bg/10" />
      <div className="absolute top-3 left-3 flex items-center gap-2">
        <LiveBadge state={state} minutes={minutesUntil(event.startsAt, now)} />
        <span className="inline-flex items-center gap-1 rounded-md bg-black/50 px-2 py-0.5 text-xs font-semibold backdrop-blur">
          <SportIcon slug={sport.slug} className="h-3.5 w-3.5" />
          {sport.name}
        </span>
      </div>
      <div className="relative p-4">
        {match ? (
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 flex-1 flex-col items-center gap-1 text-center">
              <Crest team={match.home} size={40} />
              <span className="line-clamp-1 text-sm font-semibold">{match.home.name}</span>
            </div>
            <span className="font-display text-xl font-bold text-white/60 italic">x</span>
            <div className="flex min-w-0 flex-1 flex-col items-center gap-1 text-center">
              <Crest team={match.away} size={40} />
              <span className="line-clamp-1 text-sm font-semibold">{match.away.name}</span>
            </div>
          </div>
        ) : (
          <h3 className="line-clamp-2 font-display text-2xl leading-tight font-bold">{event.title}</h3>
        )}
        <p className="mt-2 truncate text-xs text-white/75">
          {state === "live"
            ? `Começou às ${formatTime(event.startsAt, timezone)}`
            : isTimeTbc(event, timezone)
              ? "Horário a confirmar"
              : `Às ${formatTime(event.startsAt, timezone)}`}
          {" em "}
          {event.venueName === UNKNOWN_VENUE ? "local a confirmar" : event.venueName}
        </p>
      </div>
    </Link>
  );
}
