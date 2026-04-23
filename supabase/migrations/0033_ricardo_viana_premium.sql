-- Migration 0033: libera premium vitalicio pro Ricardo Viana
--
-- Ricardo Viana (ricardovianavillela@gmail.com): f740ac69-da73-44df-8e4c-70b4c4a7e085
--
-- Cria assinatura anual ativa com current_period_end daqui a 100 anos.
-- Idempotente: remove assinaturas anteriores do user antes de inserir.

delete from public.subscriptions
 where user_id = 'f740ac69-da73-44df-8e4c-70b4c4a7e085';

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
    'f740ac69-da73-44df-8e4c-70b4c4a7e085',
    'annual',
    'active',
    'manual',
    now(),
    now() + interval '100 years',
    false
  );
