-- NOW: importação automática de eventos de fontes externas (API-Sports).
-- Rode no SQL Editor depois de 0001 e 0002.

-- De onde veio cada evento. "manual" = cadastrado por um organizador no site.
alter table public.events
  add column source text not null default 'manual',
  add column external_id text;

-- Evita duplicar: cada jogo de uma fonte entra uma vez só e é atualizado nas próximas importações.
alter table public.events
  add constraint events_source_external_key unique (source, external_id);

-- Organizadores criados pela importação (um por campeonato), sem login.
alter table public.organizers add column source_key text unique;

-- Histórico das importações, visível no /admin.
create table public.import_runs (
  id bigserial primary key,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  trigger text not null, -- 'cron' ou 'admin'
  ok boolean,
  summary jsonb
);

alter table public.import_runs enable row level security;
create policy "admins veem importações" on public.import_runs for select using (public.is_admin());

grant select on public.import_runs to authenticated;

-- A importação roda com a chave secreta (service_role), que ignora o RLS mas precisa dos GRANTs.
grant usage on schema public to service_role;
grant all on public.cities, public.sports, public.organizers, public.events, public.import_runs to service_role;
grant usage, select on all sequences in schema public to service_role;
