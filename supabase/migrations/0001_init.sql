-- NOW: esquema inicial
-- Cidades, esportes, organizadores e eventos, com moderação (pendente/aprovado/rejeitado).

create extension if not exists "pgcrypto";

create table public.cities (
  id smallserial primary key,
  slug text not null unique,
  name text not null,
  uf char(2) not null,
  timezone text not null -- fuso IANA, ex.: America/Manaus
);

create table public.sports (
  id smallserial primary key,
  slug text not null unique,
  name text not null,
  emoji text
);

create type public.organizer_role as enum ('organizer', 'admin');

create table public.organizers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users (id) on delete cascade, -- nulo para organizadores do seed
  name text not null,
  instagram text,
  whatsapp text,
  role public.organizer_role not null default 'organizer',
  created_at timestamptz not null default now()
);

create type public.event_status as enum ('pending', 'approved', 'rejected');

create table public.events (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid not null references public.organizers (id) on delete cascade,
  city_id smallint not null references public.cities (id),
  sport_id smallint not null references public.sports (id),
  title text not null check (char_length(title) between 3 and 120),
  description text,
  venue_name text not null,
  address text not null,
  maps_url text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  is_free boolean not null default true,
  price_cents integer check (price_cents is null or price_cents >= 0),
  ticket_url text,
  image_url text,
  status public.event_status not null default 'pending',
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create index events_city_time_idx on public.events (city_id, status, ends_at, starts_at);
create index events_organizer_idx on public.events (organizer_id);

-- Mantém updated_at.
create or replace function public.touch_event() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger events_touch before update on public.events
for each row execute function public.touch_event();

-- Helpers de permissão
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from organizers where user_id = auth.uid() and role = 'admin');
$$;

create or replace function public.my_organizer_id() returns uuid
language sql stable security definer set search_path = public as $$
  select id from organizers where user_id = auth.uid();
$$;

-- RLS
alter table public.cities enable row level security;
alter table public.sports enable row level security;
alter table public.organizers enable row level security;
alter table public.events enable row level security;

create policy "cidades públicas" on public.cities for select using (true);
create policy "esportes públicos" on public.sports for select using (true);

create policy "organizadores públicos" on public.organizers for select using (true);
create policy "criar meu perfil" on public.organizers for insert
  with check (user_id = auth.uid() and role = 'organizer');
create policy "editar meu perfil" on public.organizers for update
  using (user_id = auth.uid()) with check (user_id = auth.uid() and role = 'organizer');

create policy "ver eventos aprovados, meus ou como admin" on public.events for select
  using (status = 'approved' or organizer_id = public.my_organizer_id() or public.is_admin());
create policy "criar meus eventos (pendentes)" on public.events for insert
  with check (organizer_id = public.my_organizer_id() and status = 'pending');
create policy "editar meus eventos" on public.events for update
  using (organizer_id = public.my_organizer_id() or public.is_admin())
  with check (public.is_admin() or (organizer_id = public.my_organizer_id() and status = 'pending'));
create policy "excluir meus eventos" on public.events for delete
  using (organizer_id = public.my_organizer_id() or public.is_admin());

-- Storage: bucket público para fotos dos eventos
insert into storage.buckets (id, name, public) values ('event-images', 'event-images', true)
on conflict (id) do nothing;

create policy "fotos públicas" on storage.objects for select using (bucket_id = 'event-images');
create policy "organizador envia fotos" on storage.objects for insert to authenticated
  with check (bucket_id = 'event-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "organizador apaga suas fotos" on storage.objects for delete to authenticated
  using (bucket_id = 'event-images' and (storage.foldername(name))[1] = auth.uid()::text);
