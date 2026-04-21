-- Migration 0015: plano personalizado por usuario (override do plan_day_exercises global)
--
-- Permite que cada usuario tenha seu proprio conjunto de exercicios por plan_day,
-- gerado pelo motor de plano (lib/plan-generator.ts). Quando o user nao tem
-- override, a query cai pro plan_day_exercises global do seed (comportamento antigo).

create table if not exists public.user_plan_day_exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_day_id uuid not null references public.plan_days(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id),
  position smallint not null,
  sets smallint not null default 3,
  reps text,
  rest text,
  created_at timestamptz not null default now(),
  unique (user_id, plan_day_id, position)
);

create index if not exists user_plan_day_exercises_user_day_idx
  on public.user_plan_day_exercises (user_id, plan_day_id);

alter table public.user_plan_day_exercises enable row level security;

drop policy if exists "own_user_plan_all" on public.user_plan_day_exercises;
create policy "own_user_plan_all"
  on public.user_plan_day_exercises for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Marca no profile quando o user gerou seu plano, pra UI mostrar status
alter table public.profiles
  add column if not exists plan_generated_at timestamptz;
