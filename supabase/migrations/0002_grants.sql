-- Permissões das tabelas para os papéis da API do Supabase.
-- Projetos novos do Supabase não concedem acesso automático a tabelas criadas via SQL;
-- sem isto a API responde "permission denied for table ...". As regras finas ficam no RLS (0001).

grant usage on schema public to anon, authenticated;

grant select on public.cities, public.sports, public.organizers, public.events to anon, authenticated;
grant insert, update on public.organizers to authenticated;
grant insert, update, delete on public.events to authenticated;
grant usage, select on all sequences in schema public to authenticated;

grant execute on function public.is_admin(), public.my_organizer_id() to anon, authenticated;
