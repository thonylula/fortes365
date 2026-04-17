-- Cache de video IDs do YouTube para cada exercicio
alter table public.exercises
  add column if not exists cached_video_id text;
