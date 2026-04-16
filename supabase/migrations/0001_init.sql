-- FORTE 365 — schema inicial (Fase 0)
-- Tabelas de conteúdo (públicas para leitura) + tabelas de usuário (RLS).
-- Compatível com o schema Supabase padrão: auth.users, auth.uid().
--
-- Referências do plano: buzzing-stirring-moon.md § Schema Supabase (mínimo viável).

begin;

-- ─────────────────────────────────────────────────────────────
-- Extensões
-- ─────────────────────────────────────────────────────────────
create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────────────────────
-- Enums
-- ─────────────────────────────────────────────────────────────
create type day_type as enum ('treino', 'caminhada', 'bike', 'mobilidade', 'descanso');
create type subscription_tier as enum ('free', 'monthly', 'annual', 'couple_monthly', 'couple_annual');
create type subscription_status as enum ('pending', 'active', 'past_due', 'canceled', 'expired');

-- ─────────────────────────────────────────────────────────────
-- CONTEÚDO (leitura pública, escrita só via service role)
-- ─────────────────────────────────────────────────────────────

-- 12 meses do plano anual (ordem fixa, com metadados de fase e fruta sazonal)
create table public.months (
  id smallint primary key check (id between 0 and 11),
  short_name text not null,
  name text not null,
  phase_label text not null,
  phase_css_class text not null,
  icon text not null,
  level smallint not null check (level between 0 and 3),
  has_bike boolean not null default false,
  season text not null,
  created_at timestamptz not null default now()
);

-- 4 fases (0=Iniciante, 1=Básico, 2=Intermediário, 3=Avançado/Elite)
create table public.phases (
  id smallint primary key check (id between 0 and 3),
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

-- Biblioteca de exercícios (derivada do flatten de PD)
create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  muscle_group text,
  difficulty smallint check (difficulty between 1 and 10),
  kcal_estimate smallint,
  modifier text,
  youtube_search_url text,
  created_at timestamptz not null default now()
);

-- Dias do plano: 4 fases × 7 dias = 28 registros
create table public.plan_days (
  id uuid primary key default gen_random_uuid(),
  phase_id smallint not null references public.phases(id),
  day_index smallint not null check (day_index between 0 and 6),
  type day_type not null,
  focus text,
  tip text,
  cover_key text,
  distance text,
  zone text,
  kcal_estimate smallint,
  message text,
  raw jsonb,
  unique (phase_id, day_index)
);

-- Exercícios atribuídos a um dia de treino (ordenados)
create table public.plan_day_exercises (
  id uuid primary key default gen_random_uuid(),
  plan_day_id uuid not null references public.plan_days(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id),
  position smallint not null,
  sets smallint,
  reps text,
  rest text,
  unique (plan_day_id, position)
);

-- Multiplicadores de volume por semana dentro do mês (0.8, 1.0, 1.15, 0.9)
create table public.week_volume (
  week_index smallint primary key check (week_index between 0 and 3),
  multiplier numeric(4,2) not null
);

-- Refeições estruturadas (metadata dos slots: café, almoço, etc.)
create table public.meal_slots (
  key text primary key,
  title text not null,
  default_time text not null,
  icon text,
  css_class text
);

-- Plano anual de refeições (12 meses × 7 dias, dados em jsonb por flexibilidade)
create table public.plan_meals (
  id uuid primary key default gen_random_uuid(),
  month_id smallint not null references public.months(id),
  day_index smallint not null check (day_index between 0 and 6),
  slot_key text not null references public.meal_slots(key),
  data jsonb not null,
  unique (month_id, day_index, slot_key)
);

-- Receitas (armazenadas como jsonb para preservar estrutura rica)
create table public.recipes (
  slug text primary key,
  title text not null,
  icon text,
  category text,
  time_label text,
  description text,
  data jsonb not null,
  created_at timestamptz not null default now()
);

-- Lista de compras base + sazonal
create table public.shopping_items (
  id uuid primary key default gen_random_uuid(),
  scope text not null check (scope in ('base', 'seasonal')),
  month_id smallint references public.months(id),
  category text,
  name text not null,
  amount text,
  raw jsonb
);

-- Alimentos de referência (substituições, proteínas, etc.)
create table public.foods (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  data jsonb
);

-- ─────────────────────────────────────────────────────────────
-- USUÁRIO (RLS habilitado)
-- ─────────────────────────────────────────────────────────────

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  fitness_level smallint check (fitness_level between 0 and 3),
  goals text[],
  locale text not null default 'pt-BR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Estado "onde estou no plano" — substitui forte_tab/month/week/day do localStorage
create table public.user_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  current_month smallint not null default 0 references public.months(id),
  current_week smallint not null default 0 check (current_week between 0 and 3),
  current_day smallint not null default 0 check (current_day between 0 and 6),
  current_tab text not null default 'treino',
  total_xp integer not null default 0,
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  last_workout_at timestamptz,
  updated_at timestamptz not null default now()
);

-- Uma sessão = um "dia" do plano sendo executado
create table public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_day_id uuid references public.plan_days(id),
  month_id smallint references public.months(id),
  week_index smallint check (week_index between 0 and 3),
  day_index smallint check (day_index between 0 and 6),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  rating smallint check (rating between 1 and 5),
  mood text,
  notes text
);

create index on public.workout_sessions (user_id, started_at desc);

-- Log granular por série (suporta reps, hold isométrico e calistenia lastrada)
create table public.exercise_sets (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.workout_sessions(id) on delete cascade,
  exercise_id uuid references public.exercises(id),
  position smallint not null,
  reps smallint,
  hold_seconds smallint,
  weight_kg numeric(5,2),
  rpe smallint check (rpe between 1 and 10),
  is_warmup boolean not null default false,
  is_failure boolean not null default false,
  logged_at timestamptz not null default now()
);

create index on public.exercise_sets (session_id, position);

-- Refeições extras logadas pelo usuário (substitui forte_meals do localStorage)
create table public.meal_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  logged_at timestamptz not null default now(),
  slot_key text references public.meal_slots(key),
  name text not null,
  notes text
);

create index on public.meal_log (user_id, logged_at desc);

-- Assinaturas (Mercado Pago no MVP)
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tier subscription_tier not null,
  status subscription_status not null default 'pending',
  provider text not null default 'mercadopago',
  provider_customer_id text,
  provider_subscription_id text unique,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index on public.subscriptions (user_id, status);

-- Plano casal: vincula dois perfis sob uma mesma assinatura
create table public.couple_links (
  subscription_id uuid not null references public.subscriptions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'partner')),
  joined_at timestamptz not null default now(),
  primary key (subscription_id, user_id)
);

-- ─────────────────────────────────────────────────────────────
-- Helper: auto-criar profile + user_progress quando auth.users insere
-- ─────────────────────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
    values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)))
    on conflict (id) do nothing;
  insert into public.user_progress (user_id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────────────────────

-- Conteúdo: leitura pública (até para usuários não-autenticados do tier grátis
-- navegando a landing). Escrita bloqueada (apenas service_role via seed).
alter table public.months              enable row level security;
alter table public.phases              enable row level security;
alter table public.exercises           enable row level security;
alter table public.plan_days           enable row level security;
alter table public.plan_day_exercises  enable row level security;
alter table public.week_volume         enable row level security;
alter table public.meal_slots          enable row level security;
alter table public.plan_meals          enable row level security;
alter table public.recipes             enable row level security;
alter table public.shopping_items      enable row level security;
alter table public.foods               enable row level security;

create policy "content_read_all_months"             on public.months             for select using (true);
create policy "content_read_all_phases"             on public.phases             for select using (true);
create policy "content_read_all_exercises"          on public.exercises          for select using (true);
create policy "content_read_all_plan_days"          on public.plan_days          for select using (true);
create policy "content_read_all_plan_day_exs"       on public.plan_day_exercises for select using (true);
create policy "content_read_all_week_volume"        on public.week_volume        for select using (true);
create policy "content_read_all_meal_slots"         on public.meal_slots         for select using (true);
create policy "content_read_all_plan_meals"         on public.plan_meals         for select using (true);
create policy "content_read_all_recipes"            on public.recipes            for select using (true);
create policy "content_read_all_shopping_items"     on public.shopping_items     for select using (true);
create policy "content_read_all_foods"              on public.foods              for select using (true);

-- Usuário: cada um enxerga e muta apenas as próprias linhas.
alter table public.profiles           enable row level security;
alter table public.user_progress      enable row level security;
alter table public.workout_sessions   enable row level security;
alter table public.exercise_sets      enable row level security;
alter table public.meal_log           enable row level security;
alter table public.subscriptions      enable row level security;
alter table public.couple_links       enable row level security;

create policy "profiles_self"           on public.profiles           for all using (auth.uid() = id)           with check (auth.uid() = id);
create policy "user_progress_self"      on public.user_progress      for all using (auth.uid() = user_id)      with check (auth.uid() = user_id);
create policy "workout_sessions_self"   on public.workout_sessions   for all using (auth.uid() = user_id)      with check (auth.uid() = user_id);
create policy "meal_log_self"           on public.meal_log           for all using (auth.uid() = user_id)      with check (auth.uid() = user_id);
create policy "subscriptions_self_read" on public.subscriptions      for select using (auth.uid() = user_id);
create policy "couple_links_self_read"  on public.couple_links       for select using (auth.uid() = user_id);

-- exercise_sets é derivada de workout_sessions: RLS por JOIN
create policy "exercise_sets_self"
  on public.exercise_sets
  for all
  using (
    exists (
      select 1 from public.workout_sessions s
      where s.id = exercise_sets.session_id and s.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.workout_sessions s
      where s.id = exercise_sets.session_id and s.user_id = auth.uid()
    )
  );

commit;
