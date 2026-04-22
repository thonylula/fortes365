-- Migration 0023: cache de video IDs do YouTube para cada receita
-- Espelha o padrão de exercises.cached_video_id (0005).
-- O endpoint /api/youtube-search?kind=recipe lê/escreve nesta coluna.
alter table public.recipes
  add column if not exists cached_video_id text;
