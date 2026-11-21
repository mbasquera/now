-- NOW: sites oficiais já cadastrados no robô (pesquisados em 21/11/2026).
-- Todos permitem robôs no robots.txt e mostram data, hora, ginásio e cidade de cada jogo.
insert into public.crawl_sources (url, sport_slug) values
  ('https://lnfoficial.com.br/tabela-de-jogos/', 'futsal'),           -- Liga Nacional de Futsal
  ('https://cbv.com.br/volei-de-quadra/superliga-a-masculina', 'volei'), -- Superliga masculina (CBV)
  ('https://cbv.com.br/volei-de-quadra/superliga-a-feminina', 'volei')   -- Superliga feminina (CBV)
on conflict (url) do nothing;
