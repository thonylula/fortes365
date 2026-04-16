-- Adiciona campo região ao perfil do usuário (para regionalização do coach IA)
alter table public.profiles
  add column if not exists region text
  check (region in ('nordeste', 'sudeste', 'sul', 'norte', 'centro_oeste'));
