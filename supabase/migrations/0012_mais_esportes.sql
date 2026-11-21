-- NOW: mais esportes (pesquisa de 21/11/2026) e as fontes que o robô passa a ler.
insert into public.sports (slug, name, emoji) values
  ('corrida', 'Corrida', '🏃'),
  ('ciclismo', 'Ciclismo', '🚴'),
  ('triatlo', 'Triatlo', '🏊'),
  ('handebol', 'Handebol', '🤾'),
  ('rugby', 'Rugby', '🏉')
on conflict (slug) do update set name = excluded.name, emoji = excluded.emoji;

-- Todas permitem robôs no robots.txt. Os eventos entram já aprovados, com o link da página como fonte.
insert into public.crawl_sources (url, link_pattern, sport_slug) values
  ('https://prefeitura.sp.gov.br/web/esportes/w/corridas_de_rua/8722', null, 'corrida'),   -- calendário oficial de SP
  ('https://prefeitura.poa.br/smel/calendario-de-corridas-de-rua', null, 'corrida'),        -- calendário oficial de Porto Alegre
  ('https://www.intervals.icu/events/BR/running/', null, 'corrida'),                         -- provas de corrida no Brasil
  ('https://www.intervals.icu/events/BR/cycling/', null, 'ciclismo'),                        -- provas de ciclismo no Brasil
  ('https://running.life/calendario-corridas/brasil', '/pt/event/', 'corrida'),
  ('https://running.life/calendario-triatlo/brasil', '/pt/event/', 'triatlo'),
  ('https://gotrail.run/calendario-trail-running/brasil/state-of-sao-paulo/sao-paulo', '/pt/event/', 'corrida')
on conflict (url) do nothing;
