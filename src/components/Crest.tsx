import type { Team } from "@/lib/types";

const PALETTE = ["#2563eb", "#dc2626", "#059669", "#7c3aed", "#d97706", "#0891b2", "#be185d", "#4d7c0f"];

function initials(name: string) {
  const words = name
    .replace(/\b(EC|FC|SC|AC|CR|SE|CA|EC|Esporte|Clube|Futebol|Sport|Club|de|do|da|dos|das)\b/gi, " ")
    .split(/\s+/)
    .filter(Boolean);
  const src = words.length ? words : [name];
  return (src.length === 1 ? src[0].slice(0, 3) : src.slice(0, 2).map((w) => w[0]).join("")).toUpperCase();
}

function colorFor(name: string) {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

/** Escudo do time vindo da fonte; sem escudo, um brasão com as iniciais (cor fixa por nome). */
export function Crest({ team, size = 24 }: { team: Team; size?: number }) {
  if (team.logo)
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={team.logo}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        className="shrink-0 object-contain"
        style={{ width: size, height: size }}
      />
    );
  const c = colorFor(team.name);
  return (
    <svg width={size} height={size} viewBox="0 0 32 36" className="shrink-0" aria-hidden>
      <path d="M16 1.5l13 4.2v11.5c0 8.2-5.6 14.2-13 17.3C8.6 31.4 3 25.4 3 17.2V5.7z" fill={c} />
      <path d="M16 1.5l13 4.2v11.5c0 8.2-5.6 14.2-13 17.3z" fill="#000" opacity=".18" />
      <text
        x="16"
        y="21.5"
        textAnchor="middle"
        fontSize={initials(team.name).length > 2 ? 9.5 : 12}
        fontWeight="800"
        fill="#fff"
        fontFamily="var(--font-display), sans-serif"
      >
        {initials(team.name)}
      </text>
    </svg>
  );
}
