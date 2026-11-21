import { isImported } from "./source";
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

/** Duração usada para eventos sem horário informado: o dia inteiro (00:00 às 23:59). */
export const TBC_DURATION_MS = 86_340_000;

/** Meia-noite (00:00) de uma data AAAA-MM-DD no fuso informado, em ISO/UTC. */
export function zonedMidnight(date: string, timezone: string): string {
  const [y, m, d] = date.split("-").map(Number);
  let t = Date.UTC(y, m - 1, d, 3); // palpite: 00:00 em UTC-3
  for (let i = 0; i < 2; i++) {
    const hm = new Intl.DateTimeFormat("en-GB", { timeZone: timezone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(t));
    const [h, min] = hm.split(":").map(Number);
    const localDay = dayKey(new Date(t), timezone);
    const dayShift = localDay < date ? 24 * 60 : localDay > date ? -24 * 60 : 0;
    t -= (h * 60 + min - dayShift) * 60_000;
  }
  return new Date(t).toISOString();
}

/** A fonte não informou o horário (o evento foi gravado das 00:00 às 23:59 do dia). */
export function isTimeTbc(event: Pick<SportEvent, "startsAt" | "endsAt">, timezone: string): boolean {
  const start = new Date(event.startsAt);
  return (
    new Date(event.endsAt).getTime() - start.getTime() === TBC_DURATION_MS &&
    formatTime(event.startsAt, timezone) === "00:00"
  );
}

/** Horário de início para exibir ("19:30" ou "a confirmar"). */
export function formatStart(event: Pick<SportEvent, "startsAt" | "endsAt">, timezone: string): string {
  return isTimeTbc(event, timezone) ? "a confirmar" : formatTime(event.startsAt, timezone);
}

export function getLiveState(event: SportEvent, now: Date, timezone: string): LiveState {
  const start = new Date(event.startsAt).getTime();
  const end = new Date(event.endsAt).getTime();
  const t = now.getTime();
  if (end <= t) return "ended";
  if (isTimeTbc(event, timezone))
    return dayKey(new Date(start), timezone) === dayKey(now, timezone) ? "later_today" : "upcoming";
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
  if (event.isFree) return "Grátis";
  if (!event.priceCents) return isImported(event.source) ? "Preço não informado" : "Ingresso pago";
  return (event.priceCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function mapsLink(event: SportEvent): string {
  return (
    event.mapsUrl ??
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${event.venueName}, ${event.address}`)}`
  );
}

function tzOffsetMs(date: Date, timezone: string): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
      .formatToParts(date)
      .map((p) => [p.type, p.value]),
  );
  const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

/** "2026-11-20T19:30" no horário local da cidade -> instante UTC. */
export function localInputToUtc(local: string, timezone: string): Date {
  const wall = new Date(`${local}:00Z`);
  if (Number.isNaN(wall.getTime())) throw new Error("Data inválida");
  let guess = new Date(wall.getTime() - tzOffsetMs(wall, timezone));
  guess = new Date(wall.getTime() - tzOffsetMs(guess, timezone));
  return guess;
}

/** Instante ISO -> valor para <input type="datetime-local"> no fuso da cidade. */
export function utcToLocalInput(iso: string, timezone: string): string {
  const d = new Date(iso);
  const local = new Date(d.getTime() + tzOffsetMs(d, timezone));
  return local.toISOString().slice(0, 16);
}
