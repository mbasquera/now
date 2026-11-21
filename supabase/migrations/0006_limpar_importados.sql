-- NOW: apaga jogos importados cuja cidade foi deduzida pelo nome do time (podiam estar na capital errada,
-- ex.: "Frei Paulistano", de Sergipe, caiu em São Paulo). A próxima importação traz de volta os que forem confiáveis.
delete from public.events
where source = 'api-sports'
  and venue_name like 'Mando de %';
