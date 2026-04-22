-- Migration 0032: libera premium vitalicio pros avaliadores
--
-- Paulo Junior (prfsjunior@gmail.com): 0fdf492e-c38a-4f18-b57a-6b9b01f3cc06
-- Davi Viana  (daviviana.games@gmail.com): 6cf28c77-b2bd-4355-8083-17e720ab72a9
--
-- Cria assinaturas anuais ativas com current_period_end daqui a 100 anos.
-- Idempotente: remove assinaturas anteriores de cada user antes de inserir.

delete from public.subscriptions
 where user_id in (
   '0fdf492e-c38a-4f18-b57a-6b9b01f3cc06',
   '6cf28c77-b2bd-4355-8083-17e720ab72a9'
 );

insert into public.subscriptions (
  user_id,
  tier,
  status,
  provider,
  current_period_start,
  current_period_end,
  cancel_at_period_end
)
values
  (
    '0fdf492e-c38a-4f18-b57a-6b9b01f3cc06',
    'annual',
    'active',
    'manual',
    now(),
    now() + interval '100 years',
    false
  ),
  (
    '6cf28c77-b2bd-4355-8083-17e720ab72a9',
    'annual',
    'active',
    'manual',
    now(),
    now() + interval '100 years',
    false
  );
