import type { LiveState } from "@/lib/types";
import { formatCountdown } from "@/lib/time";

export function LiveBadge({ state, minutes }: { state: LiveState; minutes: number }) {
  if (state === "live")
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md bg-live px-2 py-0.5 font-display text-xs font-bold tracking-wide text-white">
        <span className="live-dot h-1.5 w-1.5 rounded-full bg-white" />
        AO VIVO
      </span>
    );
  if (state === "soon")
    return (
      <span className="rounded-md bg-accent px-2 py-0.5 font-display text-xs font-bold tracking-wide text-ink">
        {formatCountdown(minutes)}
      </span>
    );
  return null;
}
