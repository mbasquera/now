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
