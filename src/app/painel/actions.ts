"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCity } from "@/lib/cities";
import { localInputToUtc } from "@/lib/time";
import { createSupabaseServer, requireUser } from "@/lib/supabase/server";

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const opt = (f: FormData, k: string) => str(f, k) || null;

function cleanInstagram(v: string | null) {
  return v ? v.replace(/^@/, "").replace(/^https?:\/\/(www\.)?instagram\.com\//, "").replace(/\/.*$/, "") || null : null;
}
function cleanWhatsapp(v: string | null) {
  if (!v) return null;
  let d = v.replace(/\D/g, "");
  if (d.length === 10 || d.length === 11) d = `55${d}`;
  return d || null;
}

export async function saveProfile(form: FormData) {
  const { supabase, user, organizer } = await requireUser();
  const name = str(form, "name");
  if (name.length < 2) redirect("/painel/perfil?erro=nome");
  const row = {
    name,
    instagram: cleanInstagram(opt(form, "instagram")),
    whatsapp: cleanWhatsapp(opt(form, "whatsapp")),
  };
  const { error } = organizer
    ? await supabase.from("organizers").update(row).eq("id", organizer.id)
    : await supabase.from("organizers").insert({ ...row, user_id: user.id });
  if (error) redirect(`/painel/perfil?erro=${encodeURIComponent(error.message)}`);
  revalidatePath("/painel");
  redirect("/painel");
}

export async function saveEvent(form: FormData) {
  const { supabase, user, organizer } = await requireUser();
  if (!organizer) redirect("/painel/perfil");

  const id = opt(form, "id");
  const back = id ? `/painel/eventos/${id}` : "/painel/eventos/novo";
  const fail = (msg: string): never => redirect(`${back}?erro=${encodeURIComponent(msg)}`);

  const city = getCity(str(form, "city"));
  if (!city) fail("Escolha a cidade.");
  const title = str(form, "title");
  if (title.length < 3) fail("Dê um nome ao evento.");
  const venue = str(form, "venue_name");
  const address = str(form, "address");
  if (!venue || !address) fail("Informe o local e o endereço.");

  let startsAt: Date, endsAt: Date;
  try {
    startsAt = localInputToUtc(str(form, "starts_at"), city!.timezone);
    endsAt = localInputToUtc(str(form, "ends_at"), city!.timezone);
  } catch {
    return fail("Informe data e hora de início e fim.");
  }
  if (endsAt <= startsAt) fail("O fim precisa ser depois do início.");

  const isFree = form.get("is_free") === "on";
  const price = str(form, "price").replace(/\./g, "").replace(",", ".");
  const priceCents = isFree ? null : Math.round(parseFloat(price) * 100);
  if (!isFree && (!priceCents || priceCents < 0)) fail("Informe o preço ou marque como gratuito.");

  const sourceUrl = str(form, "source_url");
  if (!/^https?:\/\/\S+\.\S+/i.test(sourceUrl))
    fail("Informe o link de divulgação (Instagram, site ou página de ingressos), começando com https://.");

  const [{ data: cityRow }, { data: sportRow }] = await Promise.all([
    supabase.from("cities").select("id").eq("slug", city!.slug).single(),
    supabase.from("sports").select("id").eq("slug", str(form, "sport")).single(),
  ]);
  if (!cityRow || !sportRow) fail("Cidade ou esporte inválido.");

  let imageUrl = opt(form, "current_image_url");
  const file = form.get("image");
  if (file instanceof File && file.size > 0) {
    if (!file.type.startsWith("image/")) fail("A foto precisa ser uma imagem.");
    if (file.size > 5 * 1024 * 1024) fail("A foto pode ter no máximo 5 MB.");
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
    const path = `${user.id}/${randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("event-images").upload(path, file, { contentType: file.type });
    if (error) fail(`Erro ao enviar a foto: ${error.message}`);
    imageUrl = supabase.storage.from("event-images").getPublicUrl(path).data.publicUrl;
  }

  const row = {
    organizer_id: organizer!.id,
    city_id: cityRow!.id,
    sport_id: sportRow!.id,
    title,
    description: opt(form, "description"),
    venue_name: venue,
    address,
    maps_url: opt(form, "maps_url"),
    starts_at: startsAt!.toISOString(),
    ends_at: endsAt!.toISOString(),
    is_free: isFree,
    price_cents: priceCents,
    ticket_url: isFree ? null : opt(form, "ticket_url"),
    image_url: imageUrl,
    source_url: sourceUrl,
    // Toda edição volta para a fila de aprovação (admins aprovam na etapa 3).
    status: "pending" as const,
    rejection_reason: null,
  };

  const { error } = id
    ? await supabase.from("events").update(row).eq("id", id)
    : await supabase.from("events").insert(row);
  if (error) fail(error.message);

  revalidatePath("/painel");
  redirect("/painel?salvo=1");
}

export async function deleteEvent(form: FormData) {
  const { supabase } = await requireUser();
  await supabase.from("events").delete().eq("id", str(form, "id"));
  revalidatePath("/painel");
  redirect("/painel?excluido=1");
}

export async function signOut() {
  const supabase = await createSupabaseServer();
  await supabase.auth.signOut();
  redirect("/");
}
