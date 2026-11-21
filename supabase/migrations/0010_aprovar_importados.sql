-- NOW: o que o próprio site importa (API e robô de sites) entra aprovado.
-- Aprova os eventos de sites que ficaram pendentes antes dessa mudança. Recusados continuam recusados.
update public.events set status = 'approved' where source <> 'manual' and status = 'pending';
