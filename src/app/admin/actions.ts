"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase/server";

async function requireAdmin() {
  const ctx = await requireUser("/admin");
  if (ctx.organizer?.role !== "admin") redirect("/painel");
  return ctx;
}

export async function moderate(form: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(form.get("id"));
  const decision = String(form.get("decision"));
  const reason = String(form.get("reason") ?? "").trim() || null;
  const patch =
    decision === "approve"
      ? { status: "approved" as const, rejection_reason: null }
      : { status: "rejected" as const, rejection_reason: reason ?? "Sem motivo informado" };
  await supabase.from("events").update(patch).eq("id", id);
  revalidatePath("/admin");
  redirect("/admin");
}

/** Botão "Importar agora" do /admin. */
export async function importNow() {
  await requireAdmin();
  const { runImport } = await import("@/lib/ingest/run");
  let result: string;
  try {
    const summary = await runImport("admin");
    result = summary.ok
      ? "ok"
      : summary.message ?? "A importação terminou com erros. Veja os detalhes abaixo.";
  } catch (e) {
    result = `Erro inesperado: ${e instanceof Error ? e.message : String(e)}`;
  }
  revalidatePath("/admin");
  redirect(`/admin?importacao=${encodeURIComponent(result)}`);
}

/** Botão "Ler sites agora". */
export async function crawlNow() {
  await requireAdmin();
  const { runCrawl } = await import("@/lib/ingest/crawler");
  let result: string;
  try {
    const s = await runCrawl("admin");
    result = s.ok ? "sites-ok" : s.message ?? "Erro ao ler os sites.";
  } catch (e) {
    result = `Erro inesperado: ${e instanceof Error ? e.message : String(e)}`;
  }
  revalidatePath("/admin");
  redirect(`/admin?sites=${encodeURIComponent(result)}`);
}

export async function addSite(form: FormData) {
  const { supabase } = await requireAdmin();
  const url = String(form.get("url") ?? "").trim();
  const link_pattern = String(form.get("link_pattern") ?? "").trim() || null;
  const sport_slug = String(form.get("sport_slug") ?? "").trim() || null;
  if (!/^https?:\/\/\S+\.\S+/.test(url)) redirect(`/admin?sites=${encodeURIComponent("Informe um link começando com https://")}`);
  const { error } = await supabase.from("crawl_sources").insert({ url, link_pattern, sport_slug });
  revalidatePath("/admin");
  redirect(`/admin?sites=${encodeURIComponent(error ? `Erro: ${error.message}` : "site-adicionado")}`);
}

export async function removeSite(form: FormData) {
  const { supabase } = await requireAdmin();
  await supabase.from("crawl_sources").delete().eq("id", Number(form.get("id")));
  revalidatePath("/admin");
  redirect("/admin");
}
