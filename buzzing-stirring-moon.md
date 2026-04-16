# Plano — FORTE 365 → App SaaS de Calistenia Acessível

## Contexto

Hoje o projeto é um **único arquivo HTML vanilla** (`forte365_v2.html`, ~1.750 linhas) com um plano anual de calistenia + nutrição em pt-BR para dois usuários (Luanthony & Jéssica). Todo o conteúdo está inline como constantes JS (`MONTHS`, `PD` com 4 fases × 7 dias, `WVOL`, receitas, compras, fisio), estado persistido em `localStorage` sob chaves `forte_*`, e sem backend.

O usuário quer transformar isso em um **app web comercial de calistenia com planos mensais**, acessível à massa brasileira (preço baixo), aproveitando a arquitetura do relatório técnico fornecido (Next.js 15 + NestJS + Supabase + Claude + PWA offline-first). O relatório é ótimo como norte, mas foi escrito para um mercado global com preço US$12.99/mês — **precisa ser adaptado ao bolso brasileiro**.

A oportunidade central é a mesma identificada no relatório: nenhum concorrente web-first em calistenia, nenhum com periodização inteligente, nenhum confiável offline. E o nosso diferencial extra é que **já temos 1 ano de conteúdo curado em pt-BR pronto para virar seed data**.

## Visão do produto

- **Nome/marca**: FORTE 365 (manter).
- **Público**: massa brasileira, iniciantes a intermediários em calistenia + reeducação alimentar. Mobile-first (maioria acessa pelo celular).
- **Idioma**: pt-BR apenas no MVP.
- **Formato**: PWA instalável (Android/iOS via "Adicionar à tela inicial"), sem app nativo no MVP — evita comissão de 30% das stores e reduz custo.
- **Proposta única**: plano de 12 meses periodizado (4 fases), acessível offline, com coach IA em português e sem perder dados. Preço popular.

## Stack recomendado (adaptado do relatório)

Sigo o relatório em tudo que é barato e high-leverage, e simplifico onde ele superdimensiona para nosso estágio.

| Camada | Escolha | Por que (adaptação) |
|---|---|---|
| Frontend | **Next.js 15 (App Router) + TypeScript** | Conforme relatório. |
| UI | **Tailwind v4 + shadcn/ui + Radix** | Conforme relatório. Mantém a estética dark/laranja que já existe no HTML. |
| Estado cliente | **Zustand v5** | Conforme relatório. |
| Estado servidor | **TanStack Query v5** | Conforme relatório. |
| PWA / offline | **Serwist + IndexedDB (via `idb`)** | **Crítico** — é o diferencial competitivo do relatório, e resolve o problema de conexão instável no Brasil. |
| Backend | **Supabase direto (PostgREST + Edge Functions + Auth + Storage + RLS)** em vez de NestJS no MVP | O relatório sugere NestJS, mas para MVP 0–1k usuários o Supabase sozinho elimina uma camada inteira, zera custo de servidor (free tier: 50k MAU), e já entrega Auth + DB + RLS + Realtime. NestJS entra na Fase 2, se necessário. |
| Banco | **PostgreSQL via Supabase** | Conforme relatório. |
| Cache/rate-limit | **Upstash Redis free tier** | Conforme relatório (apenas se necessário para leaderboards). |
| Pagamentos | **Mercado Pago** (Pix + cartão recorrente + boleto) | Escolhido pelo usuário. Checkout em pt-BR, Pix nativo, taxas competitivas. Stripe fica para Fase 2 se abrir para fora do Brasil. |
| IA | **Claude Haiku 4.5 (padrão) + Sonnet 4.6 (premium)** via Vercel AI SDK | Relatório sugere Sonnet como default; para preço BR, Haiku como default corta custo em ~3x e atende 80% dos usos (dicas de forma, mensagens curtas). Sonnet só no tier premium. |
| Vídeos | **YouTube embeds (como já fazemos) no MVP**; Mux só na Fase 2 | O HTML atual já usa links de busca do YouTube — reaproveitar zera custo de vídeo no MVP. Mux entra quando tivermos conteúdo próprio. |
| Visão computacional | **MediaPipe BlazePose no browser** (Fase 2) | Zero custo de servidor, mas fora do MVP. |
| Hospedagem | **Vercel (frontend, free tier) + Supabase (backend, free → Pro $25)** | ~$0–25/mês no MVP. |
| Observabilidade | **Sentry free + PostHog free** | Conforme relatório. |

**Custo-alvo do MVP**: até **R$ 150/mês** (infra + IA com caching), escalando linearmente.

## Preço acessível para o mercado BR (aprovado)

- **Grátis para sempre**: meses 1 e 2 completos (8 semanas, fases 0 e início de 1), log de treinos, PWA offline, sem coach IA.
- **Premium Mensal — R$ 14,90**: 12 meses de plano, coach IA com Claude Haiku, receitas + lista de compras, histórico ilimitado, exportação.
- **Premium Anual — R$ 99,90** (~R$ 8,30/mês, 44% off): tudo do mensal + 1 análise mensal de progresso com Claude Sonnet.
- **Plano Casal — R$ 19,90/mês ou R$ 149/ano**: 2 perfis vinculados (nasce do caso Luanthony & Jéssica).

Referência: Calisteniapp ~R$30, Tecnonutri R$19,90, Nike Training Club grátis (en). R$14,90 posiciona abaixo dos pagos e acima do "grátis ruim". Pix à vista no anual preserva margem (sem taxa de cartão recorrente).

## Pagamentos — Mercado Pago (aprovado)

- **Provedor**: Mercado Pago como único gateway no MVP (Pix + boleto + cartão recorrente). Familiar ao público massa, checkout em pt-BR, taxas: Pix ~0,99%, cartão ~4,99% + R$0,39.
- **Integração**: SDK oficial `mercadopago` (Node) em Supabase Edge Function para criação de preferências e **webhook de notificação** (`/functions/mp-webhook`) que atualiza `subscriptions.status`.
- **Recorrência**: assinaturas via Mercado Pago Assinaturas (preapproval) para cartão; Pix/boleto renovados manualmente com lembrete por email (aceitável no MVP — muitos usuários brasileiros preferem assim).
- **Stripe fica para Fase 2** se precisarmos atender usuários fora do Brasil.

## Migração do `forte365_v2.html` (reuso de conteúdo)

O HTML atual é **conteúdo + código misturados**. Extrair o conteúdo como JSON é o primeiro passo de valor e acontece antes de qualquer decisão de stack.

1. **Extração (script único, um dia)**: script Node que lê `forte365_v2.html`, usa regex/AST para capturar as constantes `MONTHS`, `PD`, `WVOL`, dados de nutrição/receitas/compras/fisio, e escreve:
   - `seed/months.json`
   - `seed/phases.json` (4 fases × 7 dias × exercícios)
   - `seed/nutrition.json`, `seed/recipes.json`, `seed/shopping.json`, `seed/physio.json`
2. **Modelagem**: transformar esses JSON em linhas no schema Postgres (ver abaixo). O script vira `supabase/seed.sql` ou um seeder TS.
3. **Fallback**: manter o HTML funcional como "versão legado" até o novo app passar por smoke test completo — sem deletar até a Fase 1 estar em produção.

Os arquivos em `knowledge/livro-*/data.json` e `knowledge/calisthenics_kb.json` são **tesouro para RAG/prompt caching** do coach IA — não são usados no MVP, mas entram no system prompt do Haiku na Fase 1.5.

## Schema Supabase (mínimo viável)

Seguindo o relatório, mas cortado para o MVP:

- `users` (espelho de `auth.users`, nível fitness, objetivos)
- `exercises` (nome, grupo muscular, dificuldade 1–10, yt_query, kcal_estimado, mod/cue) — seed a partir do `PD` achatado
- `months`, `phases`, `days`, `day_exercises` (estrutura do plano anual com month/week/day/order)
- `workout_sessions` (usuário, day_id, iniciado_em, terminado_em, rating, notas)
- `exercise_sets` (session_id, exercise_id, reps, hold_segundos, peso_kg, rpe, is_warmup, is_failure)
- `user_progress` (denormalizado: xp, streak, current_month/week/day — substitui o estado `forte_*` do localStorage)
- `meals_log` + `recipes` + `shopping_lists` (portar o conteúdo existente)
- `subscriptions` (tier, status, stripe_customer_id, current_period_end)

RLS ligado desde o dia 1 em todas as tabelas de usuário (regra: `auth.uid() = user_id`). Exercícios, planos, receitas são públicos para leitura.

Tabelas do relatório que **ficam para a Fase 2**: `exercise_progressions`/`progression_steps` (skill tree), `achievements`/`user_achievements`, `follows`, `workout_comments`, `workout_likes`, `user_exercise_prs`, leaderboards. Não são diferenciais no MVP.

## Estrutura do repositório (proposta)

Do estado atual (um HTML + pastas de conteúdo) para:

```
ATIVIDADE_FÍSICA/
  forte365_v2.html        # legado, mantido até cutover
  CLAUDE.md               # já criado
  apps/
    web/                  # Next.js 15 app
      app/                # App Router: /, /treino, /nutricao, /progresso, /conta
      components/         # shadcn/ui customizado
      lib/
        supabase/         # client + server helpers
        offline/          # Serwist + idb wrappers
        ai/               # Vercel AI SDK + prompts pt-BR
        store/            # Zustand stores
  packages/
    seed/                 # extrator do HTML → JSON → SQL
    content/              # JSONs versionados do plano
  supabase/
    migrations/
    seed.sql
    functions/            # edge functions (stripe webhook, ai proxy)
```

Pasta `projeto atividade fisica/` (duplicata) e o `.rar` ficam intocados — são backup do usuário.

## Roadmap em fases

### Fase 0 — Preparação (1 semana)
- Validar preço e escopo com o usuário (via ExitPlanMode).
- Script de extração do `forte365_v2.html` → JSON seed.
- Criar projeto Supabase, schema inicial, RLS.
- Bootstrap Next.js 15 + Tailwind + shadcn/ui com tema dark/laranja do HTML atual.

### Fase 1 — MVP (8–10 semanas)
- Auth (Supabase Auth: email/senha + Google).
- Navegação de plano (mês → semana → dia) — paridade visual com o HTML atual.
- Log de treino (sets, reps, holds), persistência online + fila offline via IndexedDB.
- PWA instalável + offline completo para o conteúdo do plano.
- Seção nutrição/receitas/compras/fisio (ported).
- Tier grátis vs premium gateado no frontend + RLS no backend.
- Stripe + Pix (ou Mercado Pago) + webhook de assinatura.
- Analytics básico (PostHog).
- Deploy em `forte365.app` (ou domínio escolhido) na Vercel.

### Fase 1.5 — Coach IA (2–3 semanas)
- Vercel AI SDK + Claude Haiku como default.
- Prompt caching com `calisthenics_kb.json` + biblioteca de exercícios no system prompt.
- Chat de dicas de forma, motivação, ajuste de dificuldade.
- Sonnet gated ao tier anual.

### Fase 2 — Diferenciação (pós-product-market-fit)
- Skill tree de progressões (push/pull/legs/core/skills).
- Gamificação (XP, streaks, achievements).
- MediaPipe BlazePose para rep counting no browser.
- Social mínimo (seguir parceiro — case Luanthony & Jéssica).
- Considerar extrair NestJS só se gargalo real aparecer.

## Arquivos / pontos críticos a tocar primeiro

- `forte365_v2.html:268-1320` — bloco `<script>` inteiro, fonte das constantes a extrair (`MONTHS`, `PD`, `WVOL`, nutrição, receitas, compras, fisio).
- `forte365_v2.html:1322-1340` — mapa exato das chaves de `localStorage` que precisam virar tabelas Supabase (`forte_completed` → `workout_sessions`+`exercise_sets`, `forte_meals` → `meals_log`, `forte_tab/month/week/day` → `user_progress`).
- `knowledge/calisthenics_kb.json` — base de conhecimento para o system prompt do coach IA.
- `knowledge/livro-{1..5}/data.json` — fonte secundária para RAG quando o KB principal ficar pequeno.
- `CLAUDE.md` — atualizar ao final da Fase 0 para refletir a nova estrutura (Next.js + Supabase) quando o HTML legado for aposentado.

## Verificação / critérios de sucesso

- **Fase 0**: `pnpm seed:extract` gera JSONs que, após seed no Supabase, reproduzem 100% do conteúdo do HTML (diff programático entre `PD` original e SELECTs do banco).
- **Fase 1**:
  - Lighthouse PWA score ≥ 90 no mobile.
  - Completar um treino **sem internet** (avião mode) e ver os dados sincronizarem ao reconectar.
  - Fluxo completo: signup → escolher plano → pagar via Pix → acessar mês 3 → logar treino → ver histórico.
  - Custo de infra ≤ R$ 150/mês com 100 usuários ativos simulados.
  - Tempo de primeira interação (onboarding → primeiro treino logado) < 90s.
- **Fase 1.5**: resposta do coach Haiku < 2s (streaming) com cache hit rate > 80% no system prompt.

## Decisões já tomadas (confirmadas)

- Preço: R$14,90/mês, R$99,90/ano, R$19,90 casal (R$149/ano casal).
- Pagamento: Mercado Pago único gateway no MVP.
- Tier grátis: meses 1 e 2 completos + tracking + PWA offline, sem coach IA.
- Stack: Supabase direto no MVP (sem NestJS) até haver gargalo real.

## Decisões pendentes (não bloqueiam o início da Fase 0)

- **Domínio**: `forte365.app`, `forte365.com.br`, ou outro? (Pode ser decidido na semana da Fase 0.)
- **Identidade visual**: manter exatamente o dark/laranja do HTML ou rebrandar? (Default: manter.)
