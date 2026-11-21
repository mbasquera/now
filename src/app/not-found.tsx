import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center py-16 text-center">
      <span className="font-display text-7xl font-extrabold text-white/15 italic">404</span>
      <h1 className="mt-2 font-display text-2xl font-bold">Não encontramos essa página</h1>
      <p className="mt-1 text-sm text-muted">O evento pode ter terminado ou o link mudou.</p>
      <Link href="/?trocar=1" className="mt-5 rounded-xl bg-accent px-5 py-2.5 font-bold text-ink">
        Escolher uma cidade
      </Link>
    </div>
  );
}
