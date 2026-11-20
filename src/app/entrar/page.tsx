import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/public";
import { createSupabaseServer } from "@/lib/supabase/server";
import { SupabaseMissing } from "@/components/SupabaseMissing";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Entrar – NOW" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; erro?: string }> }) {
  const { next: rawNext, erro } = await searchParams;
  const next = rawNext?.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/painel";

  if (isSupabaseConfigured) {
    const supabase = await createSupabaseServer();
    const { data } = await supabase.auth.getUser();
    if (data.user) redirect(next);
  }

  return (
    <div className="py-8">
      <h1 className="text-2xl font-black">Área do organizador</h1>
      <p className="mt-2 text-muted">Entre para divulgar seus jogos, lutas e campeonatos no NOW. É grátis.</p>
      {erro && <p className="mt-4 text-sm text-live">O link expirou ou é inválido. Tente de novo.</p>}
      {isSupabaseConfigured ? <LoginForm next={next} /> : <SupabaseMissing />}
    </div>
  );
}
