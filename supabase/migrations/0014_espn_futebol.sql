-- NOW: calendário de futebol da ESPN como reserva da API-Sports (não precisa de chave).
-- Lê a página do dia e segue até 3 links de outros dias do próprio calendário.
-- Só entram jogos com estádio no Brasil numa capital; jogo que a API já trouxe não é repetido.
insert into public.crawl_sources (url, link_pattern, sport_slug)
values ('https://espndeportes.espn.com/futbol/calendario', '/futbol/calendario/_/fecha/', 'futebol')
on conflict (url) do update set enabled = true, link_pattern = excluded.link_pattern, sport_slug = excluded.sport_slug;
