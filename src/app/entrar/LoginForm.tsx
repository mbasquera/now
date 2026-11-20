"use client";

import { useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/client";

export function LoginForm({ next }: { next: string }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");
  const redirectTo = () => `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    const { error } = await createSupabaseBrowser().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo() },
    });
    if (error) {
      setError(error.message);
      setState("error");
    } else setState("sent");
  }

  async function google() {
    const { error } = await createSupabaseBrowser().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: redirectTo() },
    });
    if (error) {
      setError(error.message);
      setState("error");
    }
  }

  if (state === "sent")
    return (
      <div className="mt-6 rounded-2xl border border-accent/50 bg-surface p-5">
        <p className="font-semibold">📬 Confira seu e-mail</p>
        <p className="mt-1 text-sm text-muted">Enviamos um link de acesso para {email}. Abra no celular ou computador para entrar.</p>
      </div>
    );

  return (
    <div className="mt-6 space-y-4">
      <button
        type="button"
        onClick={google}
        className="w-full rounded-xl bg-white px-4 py-3 font-semibold text-black"
      >
        Entrar com Google
      </button>
      <div className="flex items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-line" /> ou <span className="h-px flex-1 bg-line" />
      </div>
      <form onSubmit={sendLink} className="space-y-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seu@email.com"
          className="w-full rounded-xl border border-line bg-surface px-4 py-3 outline-none focus:border-accent"
        />
        <button
          disabled={state === "sending"}
          className="w-full rounded-xl bg-accent px-4 py-3 font-bold text-black disabled:opacity-60"
        >
          {state === "sending" ? "Enviando…" : "Receber link de acesso"}
        </button>
      </form>
      {state === "error" && <p className="text-sm text-live">Não deu certo: {error}</p>}
    </div>
  );
}
