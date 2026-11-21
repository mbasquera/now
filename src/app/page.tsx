import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CITIES, getCity } from "@/lib/cities";
import { getCityPulse } from "@/lib/data";
import { HERO_PHOTO, SPORTS, photoUrl } from "@/lib/sports";
import { SportIcon } from "@/components/SportIcon";

export const dynamic = "force-dynamic";

const REGIONS: { name: string; ufs: string[] }[] = [
  { name: "Sudeste", ufs: ["SP", "RJ", "MG", "ES"] },
  { name: "Nordeste", ufs: ["BA", "PE", "CE", "MA", "PB", "RN", "AL", "PI", "SE"] },
  { name: "Sul", ufs: ["PR", "RS", "SC"] },
  { name: "Centro-Oeste", ufs: ["DF", "GO", "MT", "MS"] },
  { name: "Norte", ufs: ["AM", "PA", "RO", "TO", "AC", "AP", "RR"] },
];

export default async function Home({ searchParams }: { searchParams: Promise<{ trocar?: string }> }) {
  const { trocar } = await searchParams;
  const saved = (await cookies()).get("now_city")?.value;
  if (!trocar && saved && getCity(saved)) redirect(`/${saved}`);

  const pulse = await getCityPulse();
  const totalLive = [...pulse.values()].reduce((n, p) => n + p.live, 0);
  const totalToday = [...pulse.values()].reduce((n, p) => n + p.today, 0);

  return (
    <div>
      <section className="relative -mx-4 overflow-hidden px-4 pt-10 pb-8 sm:mx-0 sm:mt-4 sm:rounded-3xl sm:px-8 sm:pt-14">
        <div className="absolute inset-0 bg-gradient-to-br from-[#11284a] to-bg" />
        <div
          role="presentation"
          className="absolute inset-0 bg-cover bg-center opacity-45"
          style={{ backgroundImage: `url("${photoUrl(HERO_PHOTO, 1600)}")` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/70 to-bg/20" />
        <div className="relative">
          {(totalLive > 0 || totalToday > 0) && (
            <p className="inline-flex items-center gap-2 rounded-full bg-black/40 px-3 py-1 text-sm font-semibold backdrop-blur">
              {totalLive > 0 ? (
                <>
                  <span className="live-dot h-2 w-2 rounded-full bg-live" />
                  {totalLive} {totalLive === 1 ? "evento ao vivo" : "eventos ao vivo"} agora no Brasil
                </>
              ) : (
                <>{totalToday} eventos nas próximas 24 horas</>
              )}
            </p>
          )}
          <h1 className="mt-4 max-w-xl font-display text-5xl leading-[0.95] font-extrabold italic sm:text-6xl">
            Tem jogo rolando agora perto de você.
          </h1>
          <p className="mt-3 max-w-md text-white/80">
            Jogos, lutas e campeonatos nas 27 capitais, com horário, local e o link da fonte oficial.
          </p>
          <ul className="mt-6 flex flex-wrap gap-2" aria-label="Esportes no NOW">
            {SPORTS.map((s) => (
              <li
                key={s.slug}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/30 py-1 pr-3 pl-1.5 text-sm backdrop-blur"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full" style={{ background: s.color, color: "#07111f" }}>
                  <SportIcon slug={s.slug} className="h-4 w-4" />
                </span>
                {s.name}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <h2 className="mt-8 font-display text-3xl font-bold">Escolha sua capital</h2>
      <p className="text-sm text-muted">O NOW lembra a sua escolha na próxima visita.</p>

      {REGIONS.map((r) => (
        <section key={r.name} className="mt-6" aria-labelledby={`r-${r.name}`}>
          <h3 id={`r-${r.name}`} className="mb-2 text-sm font-semibold text-muted">
            {r.name}
          </h3>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {r.ufs.map((uf) => {
              const c = CITIES.find((x) => x.uf === uf)!;
              const p = pulse.get(c.slug);
              return (
                <li key={c.slug}>
                  <Link
                    href={`/${c.slug}`}
                    className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-line bg-surface p-3 transition-colors hover:border-accent"
                  >
                    <span
                      aria-hidden
                      className="absolute -right-1 -bottom-2 font-display text-5xl leading-none font-extrabold text-white/[0.07] italic transition-colors group-hover:text-accent/30"
                    >
                      {c.uf}
                    </span>
                    <span className="relative min-w-0">
                      <span className="block truncate font-semibold">{c.name}</span>
                      <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted">
                        {p?.live ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-live">
                            <span className="live-dot h-1.5 w-1.5 rounded-full bg-live" />
                            {p.live} ao vivo
                          </span>
                        ) : null}
                        {p?.today ? <span>{p.today} em 24h</span> : null}
                        {!p && <span>Ver agenda</span>}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
