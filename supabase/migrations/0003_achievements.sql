-- Sistema de conquistas (achievements / badges)

create table public.achievements (
  id serial primary key,
  slug text unique not null,
  title text not null,
  description text not null,
  emoji text not null,
  category text not null check (category in ('streak', 'xp', 'workout', 'exercise', 'special')),
  threshold integer not null default 1,
  sort_order integer not null default 0
);

create table public.user_achievements (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  achievement_id integer references public.achievements(id) on delete cascade not null,
  unlocked_at timestamptz default now() not null,
  unique(user_id, achievement_id)
);

alter table public.user_achievements enable row level security;

create policy "Users read own achievements"
  on public.user_achievements for select
  using (auth.uid() = user_id);

create policy "Users insert own achievements"
  on public.user_achievements for insert
  with check (auth.uid() = user_id);

-- Achievements are public read
alter table public.achievements enable row level security;

create policy "Anyone can read achievements"
  on public.achievements for select
  using (true);

-- Seed: 18 achievements across 5 categories
insert into public.achievements (slug, title, description, emoji, category, threshold, sort_order) values
  -- Streak
  ('streak_3',    'Constância',         '3 dias seguidos treinando',        '🔥', 'streak',   3,  1),
  ('streak_7',    'Semana de Ferro',    '7 dias seguidos treinando',        '⚡', 'streak',   7,  2),
  ('streak_14',   'Duas Semanas',       '14 dias seguidos treinando',       '💪', 'streak',   14, 3),
  ('streak_30',   'Mês Invicto',        '30 dias seguidos treinando',       '👑', 'streak',   30, 4),
  ('streak_60',   'Máquina',            '60 dias seguidos treinando',       '🤖', 'streak',   60, 5),
  -- XP
  ('xp_100',      'Primeiro Centena',   'Acumulou 100 XP',                  '⭐', 'xp',       100,  10),
  ('xp_500',      'Meio Milhar',        'Acumulou 500 XP',                  '🌟', 'xp',       500,  11),
  ('xp_1000',     'Mil XP',             'Acumulou 1.000 XP',                '💫', 'xp',       1000, 12),
  ('xp_5000',     'Elite XP',           'Acumulou 5.000 XP',                '🏆', 'xp',       5000, 13),
  -- Workouts completed
  ('workout_1',   'Primeiro Treino',    'Completou seu primeiro treino',     '🎯', 'workout',  1,  20),
  ('workout_10',  'Dez Treinos',        'Completou 10 treinos',             '💥', 'workout',  10, 21),
  ('workout_50',  'Cinquentão',         'Completou 50 treinos',             '🏅', 'workout',  50, 22),
  ('workout_100', 'Centurião',          'Completou 100 treinos',            '🎖️', 'workout', 100, 23),
  ('workout_365', 'FORTE 365',          'Completou 365 treinos — um por dia!', '🏛️', 'workout', 365, 24),
  -- Exercises completed
  ('exercise_50',  '50 Exercícios',     'Fez 50 exercícios no total',       '✊', 'exercise', 50,  30),
  ('exercise_200', '200 Exercícios',    'Fez 200 exercícios no total',      '🦾', 'exercise', 200, 31),
  ('exercise_500', '500 Exercícios',    'Fez 500 exercícios no total',      '🔱', 'exercise', 500, 32),
  -- Special
  ('first_week',   'Primeira Semana',   'Completou a primeira semana do plano', '🌱', 'special', 1, 40);
