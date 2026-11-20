import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CITIES, getCity } from "@/lib/cities";

export default async function Home({ searchParams }: { searchParams: Promise<{ trocar?: string }> }) {
  const { trocar } = await searchParams;
  const saved = (await cookies()).get("now_city")?.value;
  if (!trocar && saved && getCity(saved)) redirect(`/${saved}`);

  const featured = ["sao-paulo", "rio-de-janeiro", "belo-horizonte", "manaus"];
  const sorted = [...CITIES].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  return (
    <div className="py-8">
      <h1 className="text-3xl font-black leading-tight">
        O que está rolando <span className="text-accent">agora</span>?
      </h1>
      <p className="mt-2 text-muted">Escolha sua cidade para ver jogos, lutas e campeonatos ao vivo e de hoje.</p>

      <div className="mt-6 grid grid-cols-2 gap-3">
        {featured.map((slug) => {
          const c = getCity(slug)!;
          return (
            <Link
              key={slug}
              href={`/${slug}`}
              className="rounded-2xl border border-line bg-surface p-4 font-bold hover:border-accent"
            >
              {c.name}
              <span className="block text-xs font-normal text-muted">{c.uf}</span>
            </Link>
          );
        })}
      </div>

      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wider text-muted">Todas as capitais</h2>
      <ul className="mt-3 divide-y divide-line rounded-2xl border border-line bg-surface">
        {sorted.map((c) => (
          <li key={c.slug}>
            <Link href={`/${c.slug}`} className="flex justify-between px-4 py-3 hover:bg-line/40">
              <span>{c.name}</span>
              <span className="text-muted">{c.uf}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
