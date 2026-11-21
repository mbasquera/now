import Link from "next/link";
import { SPORTS } from "@/lib/sports";
import { SportIcon } from "./SportIcon";

/** esporte: slug · dia: "agora" ou AAAA-MM-DD · preco: "gratis" | "pago" */
export type FilterState = { esporte?: string; dia?: string; preco?: string; quando?: string };

export function filterHref(base: string, current: FilterState, patch: Partial<FilterState>) {
  const next = { ...current, ...patch, quando: undefined };
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(next)) if (v) qs.set(k, v);
  const s = qs.toString();
  return s ? `${base}?${s}` : base;
}

/** Faixa de esportes com ícone e quantidade de eventos de cada um. */
export function SportRail({
  base,
  current,
  counts,
  total,
}: {
  base: string;
  current: FilterState;
  counts: Map<string, number>;
  total: number;
}) {
  const items = [
    { slug: "", name: "Todos", color: "#ffcc1f", count: total },
    ...SPORTS.map((s) => ({ slug: s.slug, name: s.name, color: s.color, count: counts.get(s.slug) ?? 0 })),
  ];
  return (
    <nav aria-label="Esportes" className="rail -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
      {items.map((s) => {
        const active = (current.esporte ?? "") === s.slug;
        return (
          <Link
            key={s.slug || "todos"}
            href={filterHref(base, current, { esporte: s.slug || undefined })}
            scroll={false}
            aria-current={active ? "page" : undefined}
            className={`group flex w-[76px] shrink-0 flex-col items-center gap-1.5 rounded-xl border px-1 pt-2.5 pb-2 transition-colors ${
              active ? "border-transparent bg-white text-ink" : "border-line bg-surface hover:border-white/30"
            } ${!active && s.count === 0 ? "opacity-45" : ""}`}
          >
            <span
              className="flex h-9 w-9 items-center justify-center rounded-full"
              style={{ background: active ? s.color : `${s.color}22`, color: active ? "#07111f" : s.color }}
            >
              {s.slug ? (
                <SportIcon slug={s.slug} className="h-5 w-5" />
              ) : (
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
                  <rect x="4" y="4" width="7" height="7" rx="2" />
                  <rect x="13" y="4" width="7" height="7" rx="2" />
                  <rect x="4" y="13" width="7" height="7" rx="2" />
                  <rect x="13" y="13" width="7" height="7" rx="2" />
                </svg>
              )}
            </span>
            <span className="text-[13px] leading-none font-semibold">{s.name}</span>
            <span className={`font-display text-xs leading-none ${active ? "text-ink/60" : "text-muted"}`}>
              {s.count}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

export type DayTab = { key: string; label: string; sub: string; count: number; live?: boolean };

/** Abas de dia: Agora, Hoje, Amanhã, Sáb 22... */
export function DayTabs({ base, current, days }: { base: string; current: FilterState; days: DayTab[] }) {
  const total = days.reduce((n, d) => n + (d.key === "agora" ? 0 : d.count), 0);
  const all: DayTab = { key: "", label: "Tudo", sub: `7 dias · ${total}`, count: total };
  return (
    <nav aria-label="Dia" className="rail -mx-4 flex gap-1 overflow-x-auto border-b border-line px-4">
      {[all, ...days].map((d) => {
        const active = (current.dia ?? "") === d.key;
        return (
          <Link
            key={d.key || "tudo"}
            href={filterHref(base, current, { dia: d.key || undefined })}
            scroll={false}
            aria-current={active ? "page" : undefined}
            className={`relative flex shrink-0 flex-col items-center px-3 pt-1 pb-2.5 ${
              active ? "text-white" : "text-muted hover:text-white"
            } ${d.count === 0 && d.key ? "opacity-50" : ""}`}
          >
            <span className="flex items-center gap-1.5 font-display text-base leading-tight font-bold">
              {d.live && <span className="live-dot h-1.5 w-1.5 rounded-full bg-live" />}
              {d.label}
            </span>
            <span className="text-[11px] leading-tight">
              {d.sub}
            </span>
            {active && <span className="absolute inset-x-2 bottom-0 h-[3px] rounded-t bg-accent" />}
          </Link>
        );
      })}
    </nav>
  );
}

export function PriceToggle({ base, current }: { base: string; current: FilterState }) {
  const opts = [
    { key: "", label: "Qualquer preço" },
    { key: "gratis", label: "Grátis" },
    { key: "pago", label: "Pago" },
  ];
  return (
    <div role="group" aria-label="Preço" className="inline-flex rounded-lg border border-line bg-surface p-0.5 text-sm">
      {opts.map((o) => {
        const active = (current.preco ?? "") === o.key;
        return (
          <Link
            key={o.key || "todos"}
            href={filterHref(base, current, { preco: o.key || undefined })}
            scroll={false}
            aria-current={active ? "true" : undefined}
            className={`rounded-md px-3 py-1 font-semibold ${active ? "bg-raised text-white" : "text-muted hover:text-white"}`}
          >
            {o.label}
          </Link>
        );
      })}
    </div>
  );
}
