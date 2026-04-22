-- Migration 0031: tabela feedback para sugestoes do usuario
--
-- Canal unidirecional user -> admin. Admin consulta via SQL direto no
-- Supabase (sem dashboard custom por ora). User pode ler apenas o
-- proprio historico.

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null check (category in ('sugestao', 'bug', 'elogio', 'outro')),
  message text not null check (char_length(message) between 10 and 500),
  created_at timestamptz not null default now()
);

create index if not exists feedback_created_at_idx on public.feedback (created_at desc);
create index if not exists feedback_user_id_idx on public.feedback (user_id);

alter table public.feedback enable row level security;

drop policy if exists "feedback_owner_insert" on public.feedback;
create policy "feedback_owner_insert"
  on public.feedback for insert
  with check (auth.uid() = user_id);

drop policy if exists "feedback_owner_read" on public.feedback;
create policy "feedback_owner_read"
  on public.feedback for select
  using (auth.uid() = user_id);
