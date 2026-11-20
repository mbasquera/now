import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase/server";
import { EventForm } from "@/components/EventForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Novo evento – NOW" };

export default async function NewEventPage({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const { organizer } = await requireUser("/painel/eventos/novo");
  if (!organizer) redirect("/painel/perfil");
  const { erro } = await searchParams;
  return (
    <div className="py-6">
      <h1 className="text-2xl font-black">Cadastrar evento</h1>
      <EventForm error={erro} />
    </div>
  );
}
