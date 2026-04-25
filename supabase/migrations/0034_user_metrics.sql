-- Migration 0034: dados antropometricos pra calculo cientifico de macros
--
-- Adiciona campos em profiles necessarios para calcular:
--   BMR via Mifflin-St Jeor (1990) — gold standard, +/-10% acuracia
--   TDEE via BMR x activity multiplier (Harris-Benedict, 1919, atualizado)
--   Macros via ISSN Position Stand on Protein (2017) + ACSM
--
-- Todos nullable: user existente continua funcionando, calculadora so opera
-- depois que ele preenche o form em /conta.

alter table public.profiles
  add column if not exists weight_kg numeric(5, 2),
  add column if not exists height_cm smallint,
  add column if not exists sex text,
  add column if not exists birth_date date,
  add column if not exists activity_level text,
  add column if not exists goal text;

-- Sex: M/F/O (other = usa formula masculina por default; user pode customizar)
alter table public.profiles
  drop constraint if exists profiles_sex_check;
alter table public.profiles
  add constraint profiles_sex_check
  check (sex is null or sex in ('M', 'F', 'O'));

-- Activity level: 5 niveis classicos da Harris-Benedict atualizada
alter table public.profiles
  drop constraint if exists profiles_activity_check;
alter table public.profiles
  add constraint profiles_activity_check
  check (
    activity_level is null
    or activity_level in ('sedentary', 'light', 'moderate', 'very', 'extreme')
  );

-- Goal: cutting (deficit), maintenance (TDEE), bulking (superavit)
alter table public.profiles
  drop constraint if exists profiles_goal_check;
alter table public.profiles
  add constraint profiles_goal_check
  check (goal is null or goal in ('cutting', 'maintenance', 'bulking'));

-- Sanity checks: peso/altura em ranges razoaveis
alter table public.profiles
  drop constraint if exists profiles_weight_range_check;
alter table public.profiles
  add constraint profiles_weight_range_check
  check (weight_kg is null or (weight_kg >= 30 and weight_kg <= 300));

alter table public.profiles
  drop constraint if exists profiles_height_range_check;
alter table public.profiles
  add constraint profiles_height_range_check
  check (height_cm is null or (height_cm >= 100 and height_cm <= 250));
