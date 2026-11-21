"use client";

import { useFormStatus } from "react-dom";

export function ImportButton() {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending}
      className="rounded-xl border border-line px-4 py-2 font-semibold disabled:cursor-wait disabled:opacity-60"
    >
      {pending ? "Importando… (pode levar até 1 minuto)" : "Importar agora"}
    </button>
  );
}
