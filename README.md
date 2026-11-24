# NOW

Site para descobrir eventos esportivos **acontecendo agora ou hoje** nas capitais brasileiras: jiu-jitsu, MMA, basquete, futebol, futsal, vôlei e mais.

Stack: Next.js (App Router) + TypeScript + Tailwind, Supabase (Postgres, Auth, Storage), deploy na Vercel.

## Rodando localmente

```bash
npm install
npm run dev
```

Abra http://localhost:3000. **Sem configurar nada**, o site já funciona com eventos fictícios (só no seu computador e nas prévias; no site de produção eles nunca aparecem) em São Paulo, Rio de Janeiro, Belo Horizonte e Manaus, com horários relativos ao momento atual (sempre há algo "ao vivo").

## Conectando ao Supabase

1. Crie um projeto em https://supabase.com.
2. No **SQL Editor**, rode `supabase/migrations/0001_init.sql` (cria tabelas, regras de acesso e o bucket de fotos) e depois `supabase/migrations/0002_grants.sql` (dá permissão à API de ler e gravar as tabelas).
3. Rode `supabase/base.sql` (27 capitais e esportes) e as migrations seguintes, na ordem (`0003_importacao.sql`, `0004_fonte.sql`, `0005_permissoes.sql`, `0006_limpar_importados.sql`). Se aparecer "permission denied for table ...", rode de novo o `0005_permissoes.sql`.
4. **Só para testes locais**, se quiser eventos fictícios: rode `supabase/seed.sql`. Nunca rode em produção. Para apagar os fictícios, rode de novo o `0004_fonte.sql`.
5. Copie `.env.example` para `.env.local` e preencha `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (botão **Connect** do Supabase > App Frameworks > Next.js; o nome antigo `NEXT_PUBLIC_SUPABASE_ANON_KEY` também é aceito).
6. Reinicie o `npm run dev`.

Na Vercel, cadastre as mesmas duas variáveis em Settings > Environment Variables.

### Login dos organizadores

1. Em **Authentication > URL Configuration**, defina o *Site URL* (ex.: `https://seusite.vercel.app`) e adicione em *Redirect URLs*: `http://localhost:3000/auth/callback` e `https://seusite.vercel.app/auth/callback`.
2. Login por e-mail (link mágico) já vem ativo. Para **Google**, ative em *Authentication > Providers > Google* com o Client ID/Secret do Google Cloud.
3. Para virar **admin** (acesso a `/admin`), entre no site uma vez, crie seu perfil e rode no SQL Editor:
   ```sql
   update organizers set role = 'admin'
   where user_id = (select id from auth.users where email = 'seu@email.com');
   ```

## Como funciona

- **Cidades** (`src/lib/cities.ts`): as 27 capitais, cada uma com seu fuso (Manaus, Cuiabá, Rio Branco etc. diferem de Brasília). Horários são salvos em UTC e exibidos no fuso da cidade.
- **Status do evento** (`src/lib/time.ts`): calculado na hora a partir de início e fim: *Ao vivo agora*, *Começa em X min* (até 2h antes), *Hoje mais tarde*, *Próximos dias*.
- **Moderação**: eventos têm status `pending`, `approved` ou `rejected`. O público só vê os aprovados (garantido por Row Level Security no banco).
- **Páginas públicas**: `/` (escolha da cidade, lembra a última), `/[cidade]` (lista com filtros de esporte, horário e preço; atualiza a cada minuto), `/evento/[id]` (detalhes, "Como chegar", contato do organizador).
- **Área do organizador**: `/entrar` (Google ou link por e-mail), `/painel` (meus eventos e status), `/painel/perfil`, `/painel/eventos/novo` e `/painel/eventos/[id]` (criar/editar com foto). Todo evento criado ou editado fica *pendente* até aprovação.
- **Moderação**: `/admin` (só para admins) mostra a fila de pendentes com Aprovar / Recusar (com motivo, que o organizador vê no painel).

## Importação automática (futebol, basquete e vôlei)

Além dos cadastros dos organizadores, o site busca sozinho os jogos dos próximos 7 dias na [API-Sports](https://api-sports.io): futebol (Séries A a D, Copa do Brasil, estaduais, regionais, feminino), basquete (NBB) e vôlei (Superliga). Só entram jogos nas capitais.

**Para ativar:**

1. No SQL Editor do Supabase, rode `supabase/migrations/0003_importacao.sql`.
2. Crie uma conta grátis em https://dashboard.api-football.com e copie a **API Key** (a mesma chave vale para os três esportes).
3. Na Vercel, em Settings > Environment Variables, cadastre:
   - `API_SPORTS_KEY`: a chave da API-Sports.
   - `SUPABASE_SECRET_KEY`: Supabase > Project Settings > API Keys > *Secret key* (`sb_secret_...`). Fica só no servidor.
   - `CRON_SECRET`: qualquer texto longo e aleatório.
4. Faça um novo deploy. A partir daí roda todo dia às 6h (Brasília), pelo `vercel.json`. Para rodar na hora, use o botão **Importar agora** no `/admin`, que também mostra o resultado das últimas importações.

**Como funciona** (`src/lib/ingest/`):

- Uma consulta por esporte por dia buscado (21 por execução), dentro das 100 por dia do plano grátis.
- **Cidade:** no futebol vem do estádio informado pela API. No basquete e no vôlei a API não informa o local, então a cidade vem do nome exato do time mandante (`match-city.ts`, lista editável) e o local aparece como "Local a confirmar". Jogos fora das capitais, ou cuja cidade não dá para saber com certeza, são ignorados.
- **Sem duplicar:** cada jogo é salvo com `source = 'api-sports'` e `external_id` únicos. Rodar de novo só atualiza horário e dados.
- **Moderação:** jogos importados entram aprovados. Se você recusar um jogo, ele continua recusado nas próximas importações. Jogos adiados ou cancelados na fonte são recusados automaticamente e voltam se forem remarcados.
- Cada campeonato vira um "organizador" (ex.: *Paulista - A1*), sem login.
- O fim do jogo é estimado (futebol 2h, basquete 2h15, vôlei 2h30), porque a API só informa o início.

**Limite do plano grátis:** a API-Sports grátis só libera jogos de ontem até depois de amanhã. Os dias além disso são pulados sem erro (o `/admin` mostra "dia(s) fora do plano grátis"). Como a importação roda todo dia, a janela vai andando junto. Para ver 7 dias à frente, assine o plano pago do esporte. A Vercel grátis só permite rodar o cron uma vez por dia.

## Fonte de cada evento

Todo evento mostra de onde veio a informação ("Fonte" no card e na página do evento):

- **Cadastrado por organizador:** o link de divulgação (Instagram, site ou página de ingressos) é obrigatório no formulário e aparece no `/admin` para você conferir antes de aprovar.
- **Importado:** "API-Sports (dados da competição)", com um link "Conferir este jogo" que abre a busca do confronto no Google, onde aparece o card oficial do jogo.

## Robô de sites (eventos além da API)

Em `/admin > Sites lidos pelo robô` você cadastra páginas públicas de eventos (calendários de federações, listas de campeonatos, páginas de ingressos). Todo dia às 6h30 o robô (`src/lib/ingest/crawler.ts`):

- respeita o `robots.txt` de cada site (se proibir, pula) e o `Crawl-delay`, esperando no mínimo 5 s entre páginas do mesmo site e lendo no máximo 4 páginas por site por execução;
- se identifica como `NOWBot/1.0` e não relê a mesma página de evento por 24 h;
- lê eventos publicados em **schema.org JSON-LD** (`Event`/`SportsEvent`), o padrão que os sites usam para o Google;
- tem leitores próprios (`src/lib/ingest/parsers.ts`) para sites oficiais sem schema.org: tabela da **LNF** (futsal) e agenda da **Superliga** na CBV (vôlei). Só entram jogos em que a página mostra data, hora, ginásio e cidade;
- não duplica jogo que já veio da API (mesmo esporte, cidade e horário, ±45 min);
- também lê calendários de corrida de rua das prefeituras de **São Paulo** e **Porto Alegre** e a lista do **intervals.icu** com corrida, ciclismo, natação (águas abertas) e triatlo (só provas em capitais; o esporte vem das etiquetas da prova). Quando a fonte não informa o horário, o evento é gravado como o dia inteiro (00:00–23:59) e o site mostra **"horário a confirmar"**;
- só aceita eventos com data, cidade de capital (`addressLocality`) e esporte reconhecível (pelo nome ou pelo esporte padrão do site);
- grava os eventos já **aprovados**, com o link da página como fonte (a moderação fica só para divulgações de organizadores; um evento que o admin recusou continua recusado).

Rode `supabase/migrations/0007_estadios.sql`, `0008_sites.sql`, `0009_sites_oficiais.sql` (cadastra os sites oficiais) e `0010_aprovar_importados.sql` (aprova os eventos de sites que estavam pendentes) antes de usar. A `0012_mais_esportes.sql` cria corrida, ciclismo, triatlo, handebol e rugby e cadastra as fontes desses esportes. A `0013_natacao.sql` cria natação e troca as listas separadas do intervals.icu pela lista completa. A `0014_espn_futebol.sql` cadastra o calendário de futebol da ESPN como reserva da API (sem chave): o leitor usa os dados da própria página (horário em UTC, times, estádio, cidade e país) e só aceita jogos no Brasil em capitais; se a página mudar, não importa nada. Ela tem um cron próprio (`/api/cron/futebol`, 10:00 UTC) que lê 8 páginas de dia por execução: hoje, amanhã e um rodízio dos dias 2 a 30, cobrindo o mês inteiro a cada 4 dias (a API-Sports grátis só vê até 2 dias à frente).

Fontes de futebol sem API que foram avaliadas e não servem hoje: tabela da Série A no site da CBF (carrega por JavaScript), SmartCalendars e FotMob (proíbem robôs). Várzea: não há base pública; Jogos da Cidade (Prefeitura de SP) publica a tabela em imagem. Jogos de várzea entram pelo cadastro de organizadores.

Atletismo de pista: o calendário da CBAt (competicoes.cbat.org.br) só mostra as tabelas com JavaScript, então o robô não consegue ler (pesquisado em 23/11/2026).

A importação da API-Sports também busca **handebol** e **rugby** (mesma chave, cota própria de 100 consultas/dia por esporte).

Sites pesquisados em 21/11/2026 e não cadastrados: IBJJF (não tem lista pública de eventos que o robô alcance), Smoothcomp (lista só aparece com JavaScript), MartialMatch (sem eventos no Brasil na lista), CBF (as páginas de Série A/B mostram só a classificação, sem a agenda), NBB/LNB (a tabela só tinha jogos já encerrados; o basquete já vem pela API) e Sympla (o robots.txt não respondeu).

## Local dos jogos de futebol

Quando a API-Sports manda um jogo sem cidade do estádio, a importação consulta o estádio (`/venues`) ou o estádio cadastrado do time mandante (`/teams`), com cache de 30 dias (`venue_cache`) e no máximo 25 consultas por execução. Quando o local vem do mandante, a descrição do evento avisa.
