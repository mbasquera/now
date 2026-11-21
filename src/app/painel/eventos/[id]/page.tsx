import { notFound, redirect } from "next/navigation";
import { getCity } from "@/lib/cities";
import { utcToLocalInput } from "@/lib/time";
import { requireUser } from "@/lib/supabase/server";
import { EventForm } from "@/components/EventForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Editar evento – NOW" };

export default async function EditEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ erro?: string }>;
}) {
  const { id } = await params;
  const { supabase, organizer } = await requireUser(`/painel/eventos/${id}`);
  if (!organizer) redirect("/painel/perfil");
  const { erro } = await searchParams;

  const { data: e } = await supabase
    .from("events")
    .select("*, sport:sports(slug), city:cities(slug)")
    .eq("id", id)
    .eq("organizer_id", organizer.id)
    .maybeSingle();
  if (!e) notFound();

  const tz = getCity(e.city?.slug)?.timezone ?? "America/Sao_Paulo";
  return (
    <div className="py-6">
      <h1 className="text-2xl font-black">Editar evento</h1>
      {e.status === "approved" && (
        <p className="mt-2 text-sm text-muted">Depois de editar, o evento volta para aprovação.</p>
      )}
      <EventForm
        error={erro}
        values={{
          id: e.id,
          title: e.title,
          sport: e.sport?.slug,
          city: e.city?.slug,
          venue_name: e.venue_name,
          address: e.address,
          maps_url: e.maps_url,
          starts_at: utcToLocalInput(e.starts_at, tz),
          ends_at: utcToLocalInput(e.ends_at, tz),
          is_free: e.is_free,
          price: e.price_cents ? (e.price_cents / 100).toFixed(2).replace(".", ",") : "",
          ticket_url: e.ticket_url,
          description: e.description,
          image_url: e.image_url,
        }}
      />
    </div>
  );
}
