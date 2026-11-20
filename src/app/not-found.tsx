import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-16 text-center">
      <p className="text-5xl">🤷</p>
      <h1 className="mt-3 text-xl font-bold">Não encontramos essa página</h1>
      <Link href="/?trocar=1" className="mt-4 inline-block text-accent underline">
        Escolher uma cidade
      </Link>
    </div>
  );
}
