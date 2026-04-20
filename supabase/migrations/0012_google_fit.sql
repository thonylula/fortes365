-- Tokens OAuth por usuario para integracoes de saude
create table if not exists public.health_integrations (
  user_id uuid references auth.users(id) on delete cascade primary key,
  provider text not null default 'google_fit',
  access_token text not null,
  refresh_token text not null,
  expires_at timestamptz not null,
  scopes text[] not null default '{}',
  connected_at timestamptz not null default now(),
  last_sync_at timestamptz
);

alter table public.health_integrations enable row level security;

drop policy if exists "own_health_integration_all" on public.health_integrations;
create policy "own_health_integration_all"
  on public.health_integrations for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Metricas diarias sincronizadas (passos, kcal ativas, FC repouso)
create table if not exists public.daily_health_metrics (
  user_id uuid references auth.users(id) on delete cascade,
  date date not null,
  steps int,
  active_minutes int,
  active_kcal int,
  resting_hr int,
  source text not null default 'google_fit',
  synced_at timestamptz not null default now(),
  primary key (user_id, date)
);

alter table public.daily_health_metrics enable row level security;

drop policy if exists "own_health_metrics_read" on public.daily_health_metrics;
create policy "own_health_metrics_read"
  on public.daily_health_metrics for select
  using (auth.uid() = user_id);

drop policy if exists "own_health_metrics_write" on public.daily_health_metrics;
create policy "own_health_metrics_write"
  on public.daily_health_metrics for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists daily_health_metrics_user_date_idx
  on public.daily_health_metrics (user_id, date desc);
