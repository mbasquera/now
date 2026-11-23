-- NOW: natação (águas abertas/travessias) e a lista completa do intervals.icu.
insert into public.sports (slug, name, emoji) values ('natacao', 'Natação', '🏊')
on conflict (slug) do update set name = excluded.name, emoji = excluded.emoji;

-- A página "todos os esportes" do intervals.icu traz corrida, ciclismo, natação e triatlo de uma vez.
-- As listas separadas de corrida e ciclismo ficam desligadas para não repetir provas.
update public.crawl_sources set enabled = false
where url in ('https://www.intervals.icu/events/BR/running/', 'https://www.intervals.icu/events/BR/cycling/');
insert into public.crawl_sources (url, sport_slug) values ('https://www.intervals.icu/events/BR/', null)
on conflict (url) do update set enabled = true;
