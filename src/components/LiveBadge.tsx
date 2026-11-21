import type { LiveState } from "@/lib/types";
import { formatCountdown } from "@/lib/time";

export function LiveBadge({ state, minutes }: { state: LiveState; minutes: number }) {
  if (state === "live")
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-live px-2.5 py-0.5 text-xs font-bold uppercase text-white">
        <span className="live-dot h-1.5 w-1.5 rounded-full bg-white" />
        Ao vivo agora
      </span>
    );
  if (state === "soon")
    return (
      <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-bold text-black">
        {formatCountdown(minutes)}
      </span>
    );
  return null;
}
