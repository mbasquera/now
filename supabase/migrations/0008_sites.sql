-- NOW: sites públicos lidos pelo robô (só dados schema.org, respeitando robots.txt).
create table if not exists public.crawl_sources (
  id serial primary key,
  url text not null unique,          -- página de listagem (ou de um evento)
  link_pattern text,                  -- opcional: trecho dos links de eventos a seguir (ex.: "/evento/")
  sport_slug text,                    -- opcional: esporte padrão quando o nome do evento não diz
  enabled boolean not null default true,
  last_run_at timestamptz,
  last_result text,
  created_at timestamptz not null default now()
);

-- Páginas de evento já lidas (não relê por 24 h).
create table if not exists public.crawl_pages (
  url text primary key,
  fetched_at timestamptz not null default now()
);

alter table public.crawl_sources enable row level security;
alter table public.crawl_pages enable row level security;
drop policy if exists "admins gerenciam sites" on public.crawl_sources;
create policy "admins gerenciam sites" on public.crawl_sources for all using (public.is_admin()) with check (public.is_admin());

grant select, insert, update, delete on public.crawl_sources to authenticated;
grant usage, select on all sequences in schema public to authenticated;
grant all on public.crawl_sources, public.crawl_pages to service_role;
grant usage, select on all sequences in schema public to service_role;
