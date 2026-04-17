-- Desafios semanais: sistema de metas temporarias com recompensa em XP

create table if not exists public.challenges (
  id serial primary key,
  slug text unique not null,
  title text not null,
  description text not null,
  emoji text not null default '🎯',
  type text not null check (type in ('workouts', 'xp', 'streak', 'skills', 'exercises')),
  target int not null,
  xp_reward int not null default 100,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  is_active boolean not null default true
);

create table if not exists public.user_challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  challenge_id int not null references public.challenges(id) on delete cascade,
  progress int not null default 0,
  completed boolean not null default false,
  completed_at timestamptz,
  unique (user_id, challenge_id)
);

alter table public.challenges enable row level security;
alter table public.user_challenges enable row level security;

create policy "challenges_read" on public.challenges for select using (true);
create policy "user_challenges_self" on public.user_challenges for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index on public.user_challenges (user_id);
create index on public.challenges (ends_at);

-- Seed: desafios ativos para esta semana
-- Usa date_trunc('week', now()) para comecar na segunda-feira
insert into public.challenges (slug, title, description, emoji, type, target, xp_reward, starts_at, ends_at) values
  (
    'week-5-workouts',
    'Consistencia Semanal',
    'Complete 5 treinos nesta semana',
    '💪',
    'workouts',
    5,
    200,
    date_trunc('week', now()),
    date_trunc('week', now()) + interval '7 days'
  ),
  (
    'week-500-xp',
    'Caca XP',
    'Acumule 500 XP nesta semana',
    '⭐',
    'xp',
    500,
    150,
    date_trunc('week', now()),
    date_trunc('week', now()) + interval '7 days'
  ),
  (
    'week-50-exercises',
    'Maratonista',
    'Complete 50 exercicios nesta semana',
    '🏃',
    'exercises',
    50,
    250,
    date_trunc('week', now()),
    date_trunc('week', now()) + interval '7 days'
  );

-- Funcao para pegar desafios ativos com progresso do usuario
create or replace function public.get_active_challenges()
returns table (
  id int,
  slug text,
  title text,
  description text,
  emoji text,
  type text,
  target int,
  xp_reward int,
  ends_at timestamptz,
  progress int,
  completed boolean
)
language sql
stable
security definer
as $$
  select
    c.id,
    c.slug,
    c.title,
    c.description,
    c.emoji,
    c.type,
    c.target,
    c.xp_reward,
    c.ends_at,
    coalesce(uc.progress, 0) as progress,
    coalesce(uc.completed, false) as completed
  from public.challenges c
  left join public.user_challenges uc
    on uc.challenge_id = c.id and uc.user_id = auth.uid()
  where c.is_active = true
    and c.ends_at > now()
    and c.starts_at <= now()
  order by c.ends_at asc;
$$;
