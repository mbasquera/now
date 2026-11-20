import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SUPABASE_KEY, SUPABASE_URL, isSupabaseConfigured } from "./env";

/** Cliente Supabase com a sessão do usuário (Server Components, Actions e Route Handlers). */
export async function createSupabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(SUPABASE_URL!, SUPABASE_KEY!, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Chamado de um Server Component: o middleware cuida de renovar a sessão.
        }
      },
    },
  });
}

export type Organizer = {
  id: string;
  user_id: string;
  name: string;
  instagram: string | null;
  whatsapp: string | null;
  role: "organizer" | "admin";
};

/** Exige login; devolve o usuário, o cliente e o perfil de organizador (se já existir). */
export async function requireUser(next = "/painel") {
  if (!isSupabaseConfigured) redirect("/entrar");
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/entrar?next=${encodeURIComponent(next)}`);
  const { data: organizer } = await supabase
    .from("organizers")
    .select("id, user_id, name, instagram, whatsapp, role")
    .eq("user_id", user.id)
    .maybeSingle<Organizer>();
  return { supabase, user, organizer };
}
