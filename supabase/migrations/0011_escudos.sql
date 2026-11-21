-- NOW: times e escudos dos jogos importados (a API-Sports informa nome e escudo de cada time e o logo do campeonato).
-- Rode no SQL Editor do Supabase. Pode rodar mais de uma vez.
alter table public.events
  add column if not exists home_name text,
  add column if not exists home_logo text,
  add column if not exists away_name text,
  add column if not exists away_logo text,
  add column if not exists league_logo text;
