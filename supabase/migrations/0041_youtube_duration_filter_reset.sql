-- Migration 0041: limpa cached_video_id pra re-busca com filtro de duracao
--
-- Contexto: 0040 introduziu youtube_query custom + reset pros warmups.
-- Mas o cache que foi re-populado APOS 0040 ainda usou a logica antiga
-- (sem filtro de duracao), entao ainda apontava pros mesmos videos
-- genericos longos (Henrich Lima "Bracos firmes" 5min, etc).
--
-- Esta migration reseta cached_video_id pra TODOS os exercicios — na
-- proxima view, o novo /api/youtube-search filtra por duracao maxima
-- (warmup=180s, exercise=360s) e exclui titulos genericos. Cache fresco,
-- video correto.
--
-- Custo: na primeira view de cada exercicio, +1 chamada YouTube. Quota
-- diaria do projeto e mais que suficiente (search.list = 100 unidades,
-- videos.list = 1 unidade, cota padrao 10000/dia → muitas centenas de
-- exercicios diferentes por dia ate atingir).

-- Reseta TODOS os exercicios (warmup ou nao) — duration filter beneficia
-- todo mundo, e os cache atuais sao todos suspeitos por terem sido
-- populados sem filtro
update public.exercises
set cached_video_id = null
where cached_video_id is not null;

-- ─────────────────────────────────────────────────────────────────────────
-- Defesa adicional: queries especificas pra warmups conhecidos que continuam
-- problematicos mesmo com a query do 0040
-- ─────────────────────────────────────────────────────────────────────────
update public.exercises
set youtube_query = 'arm circles aquecimento ombros 30 segundos demonstracao'
where slug = 'circulos-de-braco';

-- Outros warmups com nomes genericos podem precisar de override custom.
-- Adicionar conforme user reportar videos errados:
--   update exercises set youtube_query = 'XXX' where slug = 'YYY';
