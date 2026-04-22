-- Migration 0029: exercicios custom do usuario no plan_day
--
-- Permite que o user adicione exercicios proprios num plan_day sem precisar
-- de entrada no catalogo global `public.exercises`. Mantem compat com o
-- override existente (0015): linhas com exercise_id referenciam o catalogo;
-- linhas com exercise_id null usam os campos custom_*.

alter table public.user_plan_day_exercises
  alter column exercise_id drop not null;

alter table public.user_plan_day_exercises
  add column if not exists custom_name text,
  add column if not exists custom_muscle text,
  add column if not exists custom_cue text,
  add column if not exists custom_kcal smallint;

alter table public.user_plan_day_exercises
  drop constraint if exists user_plan_day_exercises_source_check;

alter table public.user_plan_day_exercises
  add constraint user_plan_day_exercises_source_check
  check (exercise_id is not null or custom_name is not null);
