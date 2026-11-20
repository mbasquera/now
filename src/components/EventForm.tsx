import Link from "next/link";
import { CITIES } from "@/lib/cities";
import { SPORTS } from "@/lib/sports";
import { Field, inputCls } from "./form";
import { PriceFields } from "./PriceFields";
import { saveEvent } from "@/app/painel/actions";

export type EventFormValues = {
  id?: string;
  title?: string;
  sport?: string;
  city?: string;
  venue_name?: string;
  address?: string;
  maps_url?: string | null;
  starts_at?: string; // datetime-local no fuso da cidade
  ends_at?: string;
  is_free?: boolean;
  price?: string;
  ticket_url?: string | null;
  description?: string | null;
  image_url?: string | null;
};

const cities = [...CITIES].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

export function EventForm({ values = {}, error }: { values?: EventFormValues; error?: string }) {
  const v = values;
  return (
    <form action={saveEvent} className="mt-6 space-y-4">
      {error && <p className="rounded-xl bg-live/15 p-3 text-sm text-live">{error}</p>}
      {v.id && <input type="hidden" name="id" value={v.id} />}
      {v.image_url && <input type="hidden" name="current_image_url" value={v.image_url} />}

      <Field label="Nome do evento">
        <input name="title" required minLength={3} maxLength={120} defaultValue={v.title} className={inputCls} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Esporte">
          <select name="sport" required defaultValue={v.sport ?? ""} className={inputCls}>
            <option value="" disabled>Escolha</option>
            {SPORTS.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.emoji} {s.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Cidade">
          <select name="city" required defaultValue={v.city ?? ""} className={inputCls}>
            <option value="" disabled>Escolha</option>
            {cities.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name} – {c.uf}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Nome do local">
        <input name="venue_name" required defaultValue={v.venue_name} placeholder="Ex.: Ginásio do Ibirapuera" className={inputCls} />
      </Field>
      <Field label="Endereço">
        <input name="address" required defaultValue={v.address} className={inputCls} />
      </Field>
      <Field label="Link do Google Maps" hint="Opcional. Se vazio, geramos a partir do endereço.">
        <input name="maps_url" type="url" defaultValue={v.maps_url ?? ""} className={inputCls} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Início">
          <input name="starts_at" type="datetime-local" required defaultValue={v.starts_at} className={inputCls} />
        </Field>
        <Field label="Fim">
          <input name="ends_at" type="datetime-local" required defaultValue={v.ends_at} className={inputCls} />
        </Field>
      </div>
      <p className="-mt-2 text-xs text-muted">Use o horário local da cidade do evento.</p>

      <PriceFields isFree={v.is_free ?? true} price={v.price ?? ""} ticketUrl={v.ticket_url ?? ""} />

      <Field label="Descrição">
        <textarea name="description" rows={4} defaultValue={v.description ?? ""} className={inputCls} />
      </Field>
      <Field label="Foto" hint="Opcional. Até 5 MB.">
        {v.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={v.image_url} alt="" className="mb-2 h-32 w-full rounded-xl object-cover" />
        )}
        <input name="image" type="file" accept="image/*" className="block w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-line file:px-3 file:py-2 file:text-white" />
      </Field>

      <p className="text-xs text-muted">Ao salvar, o evento passa por uma aprovação rápida antes de aparecer no site.</p>
      <div className="flex gap-3">
        <Link href="/painel" className="flex-1 rounded-xl border border-line px-4 py-3 text-center">
          Cancelar
        </Link>
        <button className="flex-[2] rounded-xl bg-accent px-4 py-3 font-bold text-black">Salvar evento</button>
      </div>
    </form>
  );
}
