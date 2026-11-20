import type { LiveState, SportEvent } from "./types";

export const SOON_WINDOW_MIN = 120;

/** Data (AAAA-MM-DD) de um instante no fuso informado. */
export function dayKey(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function getLiveState(event: SportEvent, now: Date, timezone: string): LiveState {
  const start = new Date(event.startsAt).getTime();
  const end = new Date(event.endsAt).getTime();
  const t = now.getTime();
  if (end <= t) return "ended";
  if (start <= t) return "live";
  if (start - t <= SOON_WINDOW_MIN * 60_000) return "soon";
  if (dayKey(new Date(start), timezone) === dayKey(now, timezone)) return "later_today";
  return "upcoming";
}

export function minutesUntil(iso: string, now: Date): number {
  return Math.max(0, Math.round((new Date(iso).getTime() - now.getTime()) / 60_000));
}

export function formatTime(iso: string, timezone: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatDayLabel(iso: string, now: Date, timezone: string): string {
  const d = new Date(iso);
  const today = dayKey(now, timezone);
  const tomorrow = dayKey(new Date(now.getTime() + 86_400_000), timezone);
  const key = dayKey(d, timezone);
  if (key === today) return "Hoje";
  if (key === tomorrow) return "Amanhã";
  const s = new Intl.DateTimeFormat("pt-BR", {
    timeZone: timezone,
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  }).format(d);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function formatCountdown(minutes: number): string {
  if (minutes < 60) return `Começa em ${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `Começa em ${h}h${String(m).padStart(2, "0")}` : `Começa em ${h}h`;
}

export function formatPrice(event: SportEvent): string {
  if (event.isFree || !event.priceCents) return "Grátis";
  return (event.priceCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function mapsLink(event: SportEvent): string {
  return (
    event.mapsUrl ??
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${event.venueName}, ${event.address}`)}`
  );
}
