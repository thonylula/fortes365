-- Migration 0040: youtube_query custom + reset de caches errados
--
-- Problema: API /api/youtube-search constroi a query como "{name} exercicio"
-- ou "{name} como fazer exercicio" e pega o PRIMEIRO resultado. Pra exercicios
-- de aquecimento com nomes ambiguos (ex: "Circulos de Braço"), o YouTube
-- algoritmo retorna videos de TREINO COMPLETO de bracos (longos, populares),
-- nao o tutorial especifico de 30s do circulo amplo.
--
-- Resultado: user adiciona "Circulos de Braço" e vê uma sequencia de
-- exercicios de braço de 5 minutos por outro criador. Confunde, e pior,
-- o video errado fica cacheado em cached_video_id eternamente.
--
-- Solucao em 2 partes:
-- A. Nova coluna youtube_query: query customizada por exercicio. Quando
--    populada, a API usa ela em vez de construir do name.
-- B. Para warmups (movement_pattern='warmup' ou muscle_group ilike
--    'aquecimento'), seed um youtube_query especifico que prioriza
--    "aquecimento ... como fazer correto" — termos que o YouTube
--    algoritmo associa a tutoriais curtos.
-- C. Reset cached_video_id pros warmups pra forcar re-busca com a nova
--    query mais especifica.

-- ─────────────────────────────────────────────────────────────────────────
-- A. Nova coluna youtube_query
-- ─────────────────────────────────────────────────────────────────────────
alter table public.exercises
  add column if not exists youtube_query text;

comment on column public.exercises.youtube_query is
  'Query customizada usada pela /api/youtube-search. Quando NULL, API constroi automaticamente do name + movement_pattern. Use pra forcar termos especificos quando o nome e ambiguo (ex: "Circulos de Braço" pega videos de treino completo de braço se a query for so o nome).';

-- ─────────────────────────────────────────────────────────────────────────
-- B. Seeds especificos pros warmups problematicos relatados
-- ─────────────────────────────────────────────────────────────────────────

-- Caso reportado: "Circulos de Braço" pegando treino completo de braço
update public.exercises
set youtube_query = 'arm circles aquecimento ombro tutorial 30 segundos'
where slug = 'circulos-de-braco';

-- ─────────────────────────────────────────────────────────────────────────
-- C. Bulk seed pros warmups: prepend "aquecimento" + suffix "como fazer correto"
--    Passa a coluna youtube_query null pra populada com query mais especifica.
--    Sufixo "como fazer correto" prioriza tutoriais bem-feitos sobre
--    sequencias longas.
-- ─────────────────────────────────────────────────────────────────────────
update public.exercises
set youtube_query = 'aquecimento ' || name || ' como fazer correto'
where (
    movement_pattern = 'warmup'
    or muscle_group ilike '%aquecimento%'
  )
  and youtube_query is null;

-- ─────────────────────────────────────────────────────────────────────────
-- D. Reseta cached_video_id pros exercicios de aquecimento — o cache
--    atual aponta pros videos errados que motivaram esse fix
-- ─────────────────────────────────────────────────────────────────────────
update public.exercises
set cached_video_id = null
where movement_pattern = 'warmup'
   or muscle_group ilike '%aquecimento%';

-- Index pra acelerar lookup de exercises sem cache (usado pelo precache)
create index if not exists exercises_no_cache_idx
  on public.exercises (slug)
  where cached_video_id is null;
