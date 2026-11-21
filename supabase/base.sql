-- Dados básicos (27 capitais e esportes). Pode rodar em produção e rodar de novo quando quiser.
-- Gerado a partir de src/lib/cities.ts e src/lib/sports.ts.

insert into public.cities (slug, name, uf, timezone) values
  ('rio-branco', 'Rio Branco', 'AC', 'America/Rio_Branco'),
  ('maceio', 'Maceió', 'AL', 'America/Maceio'),
  ('macapa', 'Macapá', 'AP', 'America/Belem'),
  ('manaus', 'Manaus', 'AM', 'America/Manaus'),
  ('salvador', 'Salvador', 'BA', 'America/Bahia'),
  ('fortaleza', 'Fortaleza', 'CE', 'America/Fortaleza'),
  ('brasilia', 'Brasília', 'DF', 'America/Sao_Paulo'),
  ('vitoria', 'Vitória', 'ES', 'America/Sao_Paulo'),
  ('goiania', 'Goiânia', 'GO', 'America/Sao_Paulo'),
  ('sao-luis', 'São Luís', 'MA', 'America/Fortaleza'),
  ('cuiaba', 'Cuiabá', 'MT', 'America/Cuiaba'),
  ('campo-grande', 'Campo Grande', 'MS', 'America/Campo_Grande'),
  ('belo-horizonte', 'Belo Horizonte', 'MG', 'America/Sao_Paulo'),
  ('belem', 'Belém', 'PA', 'America/Belem'),
  ('joao-pessoa', 'João Pessoa', 'PB', 'America/Fortaleza'),
  ('curitiba', 'Curitiba', 'PR', 'America/Sao_Paulo'),
  ('recife', 'Recife', 'PE', 'America/Recife'),
  ('teresina', 'Teresina', 'PI', 'America/Fortaleza'),
  ('rio-de-janeiro', 'Rio de Janeiro', 'RJ', 'America/Sao_Paulo'),
  ('natal', 'Natal', 'RN', 'America/Fortaleza'),
  ('porto-alegre', 'Porto Alegre', 'RS', 'America/Sao_Paulo'),
  ('porto-velho', 'Porto Velho', 'RO', 'America/Porto_Velho'),
  ('boa-vista', 'Boa Vista', 'RR', 'America/Boa_Vista'),
  ('florianopolis', 'Florianópolis', 'SC', 'America/Sao_Paulo'),
  ('sao-paulo', 'São Paulo', 'SP', 'America/Sao_Paulo'),
  ('aracaju', 'Aracaju', 'SE', 'America/Maceio'),
  ('palmas', 'Palmas', 'TO', 'America/Araguaina')
on conflict (slug) do update set name = excluded.name, uf = excluded.uf, timezone = excluded.timezone;

insert into public.sports (slug, name, emoji) values
  ('jiu-jitsu', 'Jiu-jitsu', '🥋'),
  ('mma', 'MMA', '🥊'),
  ('basquete', 'Basquete', '🏀'),
  ('futebol', 'Futebol', '⚽'),
  ('futsal', 'Futsal', '👟'),
  ('volei', 'Vôlei', '🏐'),
  ('corrida', 'Corrida', '🏃'),
  ('ciclismo', 'Ciclismo', '🚴'),
  ('triatlo', 'Triatlo', '🏊'),
  ('handebol', 'Handebol', '🤾'),
  ('rugby', 'Rugby', '🏉')
on conflict (slug) do update set name = excluded.name, emoji = excluded.emoji;
