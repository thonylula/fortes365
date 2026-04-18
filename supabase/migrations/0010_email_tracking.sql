-- Colunas de idempotencia para emails transacionais
-- Evita email duplicado quando auth/callback ou MP webhook sao chamados multiplas vezes

alter table public.profiles
  add column if not exists welcome_email_sent_at timestamptz;

alter table public.subscriptions
  add column if not exists last_payment_email_sent_at timestamptz;
