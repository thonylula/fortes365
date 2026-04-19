-- Sistema de avaliacoes (1-5 estrelas + texto)
-- Usado pra prova social na landing e aggregateRating no JSON-LD

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  body text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

alter table public.reviews enable row level security;

-- Leitura publica (landing exibe reviews pra anonimos)
create policy "reviews_public_read" on public.reviews
  for select using (true);

-- Escrita apenas do dono
create policy "reviews_owner_write" on public.reviews
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index on public.reviews (created_at desc);
create index on public.reviews (rating);
