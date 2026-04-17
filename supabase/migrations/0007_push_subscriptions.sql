-- Push notification subscriptions
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null,
  keys_p256dh text not null,
  keys_auth text not null,
  created_at timestamptz not null default now(),
  unique (user_id, endpoint)
);

alter table public.push_subscriptions enable row level security;
create policy "push_sub_self" on public.push_subscriptions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index on public.push_subscriptions (user_id);
