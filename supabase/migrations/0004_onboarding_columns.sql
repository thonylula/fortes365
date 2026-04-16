-- Colunas para o quiz de onboarding (estilo BetterMe)
alter table public.profiles
  add column if not exists age_range text,
  add column if not exists body_type text,
  add column if not exists body_goal text,
  add column if not exists calisthenics_level text,
  add column if not exists pullup_level text,
  add column if not exists flexibility text,
  add column if not exists exercise_frequency text,
  add column if not exists target_zones text[],
  add column if not exists physical_issues text[],
  add column if not exists preferred_location text,
  add column if not exists weekly_sessions text,
  add column if not exists workout_duration text,
  add column if not exists work_routine text,
  add column if not exists daily_activity text,
  add column if not exists energy_level text,
  add column if not exists sleep_hours text,
  add column if not exists water_intake text,
  add column if not exists bad_habits text[],
  add column if not exists height_cm integer,
  add column if not exists weight_kg numeric(5,1),
  add column if not exists target_weight_kg numeric(5,1),
  add column if not exists age integer,
  add column if not exists onboarding_completed boolean not null default false;

-- Usuários existentes já passam direto (sem forçar onboarding)
update public.profiles set onboarding_completed = true where created_at < now();
