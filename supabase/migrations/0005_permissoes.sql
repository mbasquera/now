-- NOW: permissões completas para a API do Supabase. Pode rodar quantas vezes quiser.
-- Projetos novos do Supabase não dão acesso automático a tabelas criadas pelo SQL Editor;
-- sem isto aparece "permission denied for table ...". As regras finas continuam no RLS.

grant usage on schema public to anon, authenticated, service_role;

-- service_role (chave secreta, usada só no servidor pela importação): acesso total.
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;

-- Público e usuários logados: leitura (o RLS decide o que cada um vê).
grant select on all tables in schema public to anon, authenticated;
grant insert, update on public.organizers to authenticated;
grant insert, update, delete on public.events to authenticated;
grant usage, select on all sequences in schema public to authenticated;
grant execute on function public.is_admin(), public.my_organizer_id() to anon, authenticated;

-- Tabelas criadas no futuro já nascem com as mesmas permissões.
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant all on sequences to service_role;
alter default privileges in schema public grant select on tables to anon, authenticated;
alter default privileges in schema public grant usage, select on sequences to authenticated;
