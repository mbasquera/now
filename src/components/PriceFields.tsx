"use client";

import { useState } from "react";
import { Field, inputCls } from "./form";

/** Entrada gratuita trava (e limpa) preço e link do ingresso. */
export function PriceFields({
  isFree: initialFree = true,
  price = "",
  ticketUrl = "",
}: {
  isFree?: boolean;
  price?: string;
  ticketUrl?: string;
}) {
  const [isFree, setIsFree] = useState(initialFree);
  const locked = `${inputCls} disabled:cursor-not-allowed disabled:opacity-40`;
  return (
    <fieldset className="rounded-2xl border border-line p-4">
      <label className="flex items-center gap-2 font-semibold">
        <input
          type="checkbox"
          name="is_free"
          checked={isFree}
          onChange={(e) => setIsFree(e.target.checked)}
          className="h-5 w-5 accent-[#c6f432]"
        />
        Entrada gratuita
      </label>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <Field label="Preço (R$)">
          <input
            key={`p-${isFree}`}
            name="price"
            inputMode="decimal"
            disabled={isFree}
            required={!isFree}
            defaultValue={isFree ? "" : price}
            placeholder={isFree ? "Grátis" : "20,00"}
            className={locked}
          />
        </Field>
        <Field label="Link do ingresso" hint={isFree ? undefined : "Opcional"}>
          <input
            key={`t-${isFree}`}
            name="ticket_url"
            type="url"
            disabled={isFree}
            defaultValue={isFree ? "" : ticketUrl}
            className={locked}
          />
        </Field>
      </div>
    </fieldset>
  );
}
