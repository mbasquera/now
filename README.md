# NOW

Site para descobrir eventos esportivos **acontecendo agora ou hoje** nas capitais brasileiras: jiu-jitsu, MMA, basquete, futebol, futsal, vôlei e mais.

Stack: Next.js (App Router) + TypeScript + Tailwind, Supabase (Postgres, Auth, Storage), deploy na Vercel.

## Rodando localmente

```bash
npm install
npm run dev
```

Abra http://localhost:3000. **Sem configurar nada**, o site já funciona com eventos fictícios em São Paulo, Rio de Janeiro, Belo Horizonte e Manaus, com horários relativos ao momento atual (sempre há algo "ao vivo").

## Conectando ao Supabase

1. Crie um projeto em https://supabase.com.
2. No **SQL Editor**, rode `supabase/migrations/0001_init.sql` (cria tabelas, regras de acesso e o bucket de fotos).
3. Rode `supabase/seed.sql` (27 capitais, esportes e eventos de exemplo). Pode rodar de novo quando quiser: ele recria os eventos de exemplo com horários a partir de agora.
4. Copie `.env.example` para `.env.local` e preencha `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Project Settings > API).
5. Reinicie o `npm run dev`.

Na Vercel, cadastre as mesmas duas variáveis em Settings > Environment Variables.

## Como funciona

- **Cidades** (`src/lib/cities.ts`): as 27 capitais, cada uma com seu fuso (Manaus, Cuiabá, Rio Branco etc. diferem de Brasília). Horários são salvos em UTC e exibidos no fuso da cidade.
- **Status do evento** (`src/lib/time.ts`): calculado na hora a partir de início e fim: *Ao vivo agora*, *Começa em X min* (até 2h antes), *Hoje mais tarde*, *Próximos dias*.
- **Moderação**: eventos têm status `pending`, `approved` ou `rejected`. O público só vê os aprovados (garantido por Row Level Security no banco).
- **Páginas**: `/` (escolha da cidade, lembra a última), `/[cidade]` (lista com filtros de esporte, horário e preço; atualiza a cada minuto), `/evento/[id]` (detalhes, "Como chegar", contato do organizador).

## Próximas etapas

- Login de organizador (e-mail/Google) e painel `/painel` para criar, editar e excluir eventos, com upload de foto.
- Painel `/admin` para aprovar ou rejeitar eventos.
