-- NOW: todo evento tem um link de onde veio a informação, e some com os eventos fictícios.
-- Rode no SQL Editor depois de 0003.

-- Link da fonte: Instagram/site/página de ingressos (organizador) ou página para conferir o jogo (importados).
alter table public.events add column if not exists source_url text;

-- Eventos cadastrados por organizadores precisam ter link de divulgação.
-- NOT VALID: vale para eventos novos e editados, sem travar os antigos.
alter table public.events drop constraint if exists events_manual_source_url;
alter table public.events
  add constraint events_manual_source_url
  check (source <> 'manual' or (source_url is not null and source_url ~* '^https?://'))
  not valid;

-- Apaga os eventos de exemplo (criados pelo seed.sql com organizadores sem login).
-- Os organizadores da importação automática têm source_key e não são apagados.
delete from public.organizers where user_id is null and source_key is null;
