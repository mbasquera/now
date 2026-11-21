-- ATENÇÃO: só para testes locais. NÃO rode em produção: cria eventos FICTÍCIOS.
-- (Para apagá-los, rode supabase/migrations/0004_fonte.sql.)
-- Rode antes supabase/base.sql (cidades e esportes).

-- Remove eventos e organizadores de exemplo anteriores (organizadores sem login)
delete from public.organizers where user_id is null and source_key is null;

with o as (insert into public.organizers (name, instagram, whatsapp) values ('Federação Paulista de Jiu-Jitsu (fictícia)', 'copapaulistajj', null) returning id)
insert into public.events (organizer_id, city_id, sport_id, title, description, venue_name, address, starts_at, ends_at, is_free, price_cents, ticket_url, status, source_url)
select o.id, (select id from public.cities where slug = 'sao-paulo'), (select id from public.sports where slug = 'jiu-jitsu'),
  'Copa Paulista de Jiu-Jitsu', 'Mais de 800 atletas de faixa branca a preta. Lutas simultâneas em 8 áreas, finais absolutas a partir das 18h.', 'Ginásio do Ibirapuera', 'R. Manuel da Nóbrega, 1361 - Vila Mariana, São Paulo - SP',
  now() + interval '-90 minutes', now() + interval '270 minutes',
  false, 2000, null, 'approved', 'https://example.com/evento-ficticio'
from o;

with o as (insert into public.organizers (name, instagram, whatsapp) values ('Coletivo 3x3 SP', '3x3sp', null) returning id)
insert into public.events (organizer_id, city_id, sport_id, title, description, venue_name, address, starts_at, ends_at, is_free, price_cents, ticket_url, status, source_url)
select o.id, (select id from public.cities where slug = 'sao-paulo'), (select id from public.sports where slug = 'basquete'),
  'Final do Torneio de Basquete 3x3 da Paulista', 'Os 4 melhores times do 3x3 de rua disputam o título. Entrada livre, leve sua cadeira.', 'Quadra do Parque Augusta', 'R. Augusta, 200 - Consolação, São Paulo - SP',
  now() + interval '40 minutes', now() + interval '160 minutes',
  true, null, null, 'approved', 'https://example.com/evento-ficticio'
from o;

with o as (insert into public.organizers (name, instagram, whatsapp) values ('Arena Fight (fictício)', 'arenafight', '5511999990000') returning id)
insert into public.events (organizer_id, city_id, sport_id, title, description, venue_name, address, starts_at, ends_at, is_free, price_cents, ticket_url, status, source_url)
select o.id, (select id from public.cities where slug = 'sao-paulo'), (select id from public.sports where slug = 'mma'),
  'Noite do MMA – Card Principal', '10 lutas profissionais, incluindo disputa de cinturão peso-leve.', 'Arena Barra Funda', 'Av. Marquês de São Vicente, 500 - Barra Funda, São Paulo - SP',
  now() + interval '240 minutes', now() + interval '420 minutes',
  false, 6000, 'https://example.com/ingressos', 'approved', 'https://example.com/evento-ficticio'
from o;

with o as (insert into public.organizers (name, instagram, whatsapp) values ('Liga ZL Futsal', null, null) returning id)
insert into public.events (organizer_id, city_id, sport_id, title, description, venue_name, address, starts_at, ends_at, is_free, price_cents, ticket_url, status, source_url)
select o.id, (select id from public.cities where slug = 'sao-paulo'), (select id from public.sports where slug = 'futsal'),
  'Copa Zona Leste de Futsal – Semifinais', 'Semifinais do principal torneio de futsal amador da Zona Leste.', 'CEU Aricanduva', 'Av. Olga Fadel Abarca, s/n - Aricanduva, São Paulo - SP',
  now() + interval '1320 minutes', now() + interval '1500 minutes',
  true, null, null, 'approved', 'https://example.com/evento-ficticio'
from o;

with o as (insert into public.organizers (name, instagram, whatsapp) values ('Rio Beach Volley', 'riobeachvolley', null) returning id)
insert into public.events (organizer_id, city_id, sport_id, title, description, venue_name, address, starts_at, ends_at, is_free, price_cents, ticket_url, status, source_url)
select o.id, (select id from public.cities where slug = 'rio-de-janeiro'), (select id from public.sports where slug = 'volei'),
  'Circuito de Vôlei de Praia – Copacabana', 'Duplas masculinas e femininas. Arquibancada aberta ao público na areia.', 'Posto 5 – Copacabana', 'Av. Atlântica, altura da R. Figueiredo de Magalhães - Copacabana, Rio de Janeiro - RJ',
  now() + interval '-30 minutes', now() + interval '210 minutes',
  true, null, null, 'approved', 'https://example.com/evento-ficticio'
from o;

with o as (insert into public.organizers (name, instagram, whatsapp) values ('Taça das Comunidades', 'tacadascomunidades', null) returning id)
insert into public.events (organizer_id, city_id, sport_id, title, description, venue_name, address, starts_at, ends_at, is_free, price_cents, ticket_url, status, source_url)
select o.id, (select id from public.cities where slug = 'rio-de-janeiro'), (select id from public.sports where slug = 'futebol'),
  'Final da Taça das Comunidades', 'Decisão entre os dois melhores times do campeonato de futebol de comunidades.', 'Campo do Aterro do Flamengo', 'Parque do Flamengo - Flamengo, Rio de Janeiro - RJ',
  now() + interval '95 minutes', now() + interval '215 minutes',
  true, null, null, 'approved', 'https://example.com/evento-ficticio'
from o;

with o as (insert into public.organizers (name, instagram, whatsapp) values ('Rio Grappling', 'riograppling', null) returning id)
insert into public.events (organizer_id, city_id, sport_id, title, description, venue_name, address, starts_at, ends_at, is_free, price_cents, ticket_url, status, source_url)
select o.id, (select id from public.cities where slug = 'rio-de-janeiro'), (select id from public.sports where slug = 'jiu-jitsu'),
  'Rio Open de Jiu-Jitsu Sem Kimono', 'Campeonato no-gi com categorias adulto e master.', 'Tijuca Tênis Clube', 'R. Conde de Bonfim, 451 - Tijuca, Rio de Janeiro - RJ',
  now() + interval '1560 minutes', now() + interval '1980 minutes',
  false, 1500, null, 'approved', 'https://example.com/evento-ficticio'
from o;

with o as (insert into public.organizers (name, instagram, whatsapp) values ('Liga Mineira de Basquete (fictícia)', null, null) returning id)
insert into public.events (organizer_id, city_id, sport_id, title, description, venue_name, address, starts_at, ends_at, is_free, price_cents, ticket_url, status, source_url)
select o.id, (select id from public.cities where slug = 'belo-horizonte'), (select id from public.sports where slug = 'basquete'),
  'Estadual Mineiro de Basquete – Rodada', 'Rodada dupla do estadual adulto masculino.', 'Ginásio do Mineirinho', 'Av. Antônio Abrahão Caram, 1000 - São José, Belo Horizonte - MG',
  now() + interval '-15 minutes', now() + interval '105 minutes',
  false, 1000, null, 'approved', 'https://example.com/evento-ficticio'
from o;

with o as (insert into public.organizers (name, instagram, whatsapp) values ('Savassi Combat', 'savassicombat', '5531999990000') returning id)
insert into public.events (organizer_id, city_id, sport_id, title, description, venue_name, address, starts_at, ends_at, is_free, price_cents, ticket_url, status, source_url)
select o.id, (select id from public.cities where slug = 'belo-horizonte'), (select id from public.sports where slug = 'mma'),
  'BH Fight Night – Amador', 'Lutas amadoras de MMA e muay thai. Lugares limitados.', 'Academia Savassi Combat', 'R. Pernambuco, 1000 - Savassi, Belo Horizonte - MG',
  now() + interval '180 minutes', now() + interval '330 minutes',
  false, 3000, null, 'approved', 'https://example.com/evento-ficticio'
from o;

with o as (insert into public.organizers (name, instagram, whatsapp) values ('Liga Manauara de Futsal', 'futsalmanaus', null) returning id)
insert into public.events (organizer_id, city_id, sport_id, title, description, venue_name, address, starts_at, ends_at, is_free, price_cents, ticket_url, status, source_url)
select o.id, (select id from public.cities where slug = 'manaus'), (select id from public.sports where slug = 'futsal'),
  'Copa Manaus de Futsal', 'Quartas de final da copa municipal de futsal.', 'Arena Amadeu Teixeira', 'Av. Constantino Nery, s/n - Flores, Manaus - AM',
  now() + interval '20 minutes', now() + interval '170 minutes',
  true, null, null, 'approved', 'https://example.com/evento-ficticio'
from o;

with o as (insert into public.organizers (name, instagram, whatsapp) values ('Federação Amazonense (fictícia)', null, null) returning id)
insert into public.events (organizer_id, city_id, sport_id, title, description, venue_name, address, starts_at, ends_at, is_free, price_cents, ticket_url, status, source_url)
select o.id, (select id from public.cities where slug = 'manaus'), (select id from public.sports where slug = 'jiu-jitsu'),
  'Amazonas Jiu-Jitsu Championship', 'Um dos maiores campeonatos de jiu-jitsu da região Norte.', 'Ginásio Renné Monteiro', 'Av. Pedro Teixeira, s/n - Dom Pedro, Manaus - AM',
  now() + interval '-120 minutes', now() + interval '360 minutes',
  false, 1000, null, 'approved', 'https://example.com/evento-ficticio'
from o;

