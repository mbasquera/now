import Link from "next/link";
import { SPORTS } from "@/lib/sports";

export type FilterState = { esporte?: string; quando?: string; preco?: string };

function href(base: string, current: FilterState, patch: Partial<FilterState>) {
  const next = { ...current, ...patch };
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(next)) if (v) qs.set(k, v);
  const s = qs.toString();
  return s ? `${base}?${s}` : base;
}

function Chip({ active, href, children }: { active: boolean; href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      scroll={false}
      className={`shrink-0 rounded-full border px-3 py-1.5 text-sm whitespace-nowrap ${
        active ? "border-accent bg-accent font-semibold text-black" : "border-line bg-surface text-white"
      }`}
    >
      {children}
    </Link>
  );
}

export function Filters({ base, current }: { base: string; current: FilterState }) {
  return (
    <div className="space-y-2">
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <Chip active={!current.esporte} href={href(base, current, { esporte: undefined })}>
          Todos
        </Chip>
        {SPORTS.map((s) => (
          <Chip key={s.slug} active={current.esporte === s.slug} href={href(base, current, { esporte: s.slug })}>
            {s.emoji} {s.name}
          </Chip>
        ))}
      </div>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <Chip active={current.quando === "agora"} href={href(base, current, { quando: current.quando === "agora" ? undefined : "agora" })}>
          Agora
        </Chip>
        <Chip active={current.quando === "hoje"} href={href(base, current, { quando: current.quando === "hoje" ? undefined : "hoje" })}>
          Hoje
        </Chip>
        <Chip active={!current.quando} href={href(base, current, { quando: undefined })}>
          Próximos 7 dias
        </Chip>
        <span className="mx-1 w-px shrink-0 bg-line" />
        <Chip active={current.preco === "gratis"} href={href(base, current, { preco: current.preco === "gratis" ? undefined : "gratis" })}>
          Grátis
        </Chip>
        <Chip active={current.preco === "pago"} href={href(base, current, { preco: current.preco === "pago" ? undefined : "pago" })}>
          Pago
        </Chip>
      </div>
    </div>
  );
}
