import { requireUser } from "@/lib/supabase/server";
import { Field, inputCls } from "@/components/form";
import { saveProfile } from "../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Perfil do organizador – NOW" };

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const { organizer } = await requireUser("/painel/perfil");
  const { erro } = await searchParams;
  return (
    <div className="py-6">
      <h1 className="text-2xl font-black">{organizer ? "Editar perfil" : "Crie seu perfil de organizador"}</h1>
      <p className="mt-1 text-sm text-muted">Essas informações aparecem nos seus eventos para o público entrar em contato.</p>
      {erro && <p className="mt-4 text-sm text-live">{erro === "nome" ? "Informe o nome." : erro}</p>}
      <form action={saveProfile} className="mt-6 space-y-4">
        <Field label="Nome do organizador, academia ou liga">
          <input name="name" required minLength={2} defaultValue={organizer?.name} className={inputCls} />
        </Field>
        <Field label="Instagram" hint="Opcional. Ex.: @minhaacademia">
          <input name="instagram" defaultValue={organizer?.instagram ? `@${organizer.instagram}` : ""} className={inputCls} />
        </Field>
        <Field label="WhatsApp" hint="Opcional. Com DDD.">
          <input name="whatsapp" inputMode="tel" defaultValue={organizer?.whatsapp ?? ""} className={inputCls} />
        </Field>
        <button className="w-full rounded-xl bg-accent px-4 py-3 font-bold text-black">Salvar</button>
      </form>
    </div>
  );
}
