-- NOW: cache dos estádios consultados na API-Sports (para completar jogos que vêm sem local).
create table if not exists public.venue_cache (
  key text primary key, -- 'futebol:venue:123' ou 'futebol:team:456'
  name text,
  city text,
  fetched_at timestamptz not null default now()
);
alter table public.venue_cache enable row level security; -- só a importação (chave secreta) usa
grant all on public.venue_cache to service_role;
