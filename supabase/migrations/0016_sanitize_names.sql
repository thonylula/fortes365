-- Migration 0016: remove mencoes a nomes pessoais (Luanthony/Jessica) nos modifiers
-- de exercicios e mensagens de plan_days. Transforma as variacoes nomeadas em
-- instrucoes genericas para qualquer usuario cadastrado.

update public.exercises set modifier = 'Agachamento pulsado ou salto leve, conforme intensidade desejada.'
  where slug = 'agachamento-c-salto';

update public.exercises set modifier = 'Uma perna levantada. Use ambas se ainda nao conseguir uma.'
  where slug = 'ponte-unilateral';

update public.exercises set modifier = 'Versao pulsada sem salto para menor impacto.'
  where slug = 'agachamento-salto-20s-40s';

update public.exercises set modifier = 'Troca de perna no ar. Versao sem salto mas rapida se preferir menos impacto.'
  where slug = 'jump-lunge-avanco-c-salto';

update public.exercises set modifier = 'Salte sobre o degrau. Desca andando. Step-up rapido como regressao.'
  where slug = 'box-jump-degrau';

update public.exercises set modifier = 'Salto completo ou pulsado, conforme impacto tolerado.'
  where slug = 'jump-squat';

-- plan_days.message no dia final do programa
update public.plan_days
  set message = '1 ANO COMPLETO. Voce e um atleta. Parabens!'
  where message like '%Luanthony e Jessica%' or message like '%Luanthony e Jéssica%';

-- plan_days.raw (jsonb) contem msg duplicado
update public.plan_days
  set raw = jsonb_set(raw, '{msg}', '"1 ANO COMPLETO. Voce e um atleta. Parabens!"')
  where raw->>'msg' like '%Luanthony e Jessica%'
     or raw->>'msg' like '%Luanthony e Jéssica%';

-- plan_days.tip e raw snapshots com "Luanthony:" ou "Jéssica:" no texto
update public.plan_days
  set tip = replace(replace(tip,
    'Luanthony: versão sem salto se joelhos doerem.',
    'Versão sem salto se joelhos doerem.'),
    'Luanthony: ', '')
  where tip like '%Luanthony%';

update public.plan_days
  set tip = replace(tip, 'Jéssica: ', '')
  where tip like '%Jéssica%';

-- plan_days.raw (jsonb) snapshots: substitui strings conhecidas no campo tip
update public.plan_days
  set raw = jsonb_set(raw, '{tip}', to_jsonb(
    replace(replace(raw->>'tip',
      'Luanthony: versão sem salto se joelhos doerem.',
      'Versão sem salto se joelhos doerem.'),
      'Luanthony: ', '')
  ))
  where raw->>'tip' like '%Luanthony%';

update public.plan_days
  set raw = jsonb_set(raw, '{tip}', to_jsonb(replace(raw->>'tip', 'Jéssica: ', '')))
  where raw->>'tip' like '%Jéssica%';

-- plan_meals.data snapshots de porcoes (ptl/ptj)
update public.plan_meals
  set data = jsonb_set(data, '{ptl}', to_jsonb(replace(data->>'ptl', 'Luanthony: ', '')))
  where data->>'ptl' like '%Luanthony%';

update public.plan_meals
  set data = jsonb_set(data, '{ptj}', to_jsonb(replace(data->>'ptj', 'Jéssica: ', '')))
  where data->>'ptj' like '%Jéssica%';

-- recipes.data snapshots: porcao.l / porcao.j
update public.recipes
  set data = jsonb_set(data, '{porcao,l}', to_jsonb(replace(data#>>'{porcao,l}', 'Luanthony: ', 'Porção A: ')))
  where data#>>'{porcao,l}' like '%Luanthony%';

update public.recipes
  set data = jsonb_set(data, '{porcao,j}', to_jsonb(replace(data#>>'{porcao,j}', 'Jéssica: ', 'Porção B: ')))
  where data#>>'{porcao,j}' like '%Jéssica%';
