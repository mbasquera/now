export function SupabaseMissing() {
  return (
    <div className="mt-8 rounded-2xl border border-dashed border-line p-6 text-sm">
      <p className="font-semibold">Login ainda não configurado</p>
      <p className="mt-2 text-muted">
        Para organizadores entrarem e cadastrarem eventos, conecte o Supabase (veja o README: variáveis
        <code className="mx-1 text-white">NEXT_PUBLIC_SUPABASE_URL</code>e
        <code className="mx-1 text-white">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>).
      </p>
    </div>
  );
}
