-- Migration 0013: metadados ricos nos exercicios
-- Pra motor de geracao de plano personalizado (etapa 4)

alter table public.exercises
  add column if not exists min_level smallint not null default 1,
  add column if not exists movement_pattern text,
  add column if not exists equipment text[] not null default '{bodyweight}',
  add column if not exists contraindications text[] not null default '{}',
  add column if not exists skill_tag text,
  add column if not exists is_unilateral boolean not null default false,
  add column if not exists is_explosive boolean not null default false,
  add column if not exists time_based boolean not null default false,
  add column if not exists alternatives text[] not null default '{}';

create index if not exists exercises_min_level_idx on public.exercises (min_level);
create index if not exists exercises_movement_pattern_idx on public.exercises (movement_pattern);

-- ============================================================
-- UPDATE principal: min_level, movement_pattern, equipment,
-- is_unilateral, is_explosive, time_based pra todos os 140
-- ============================================================

update public.exercises e set
  min_level = v.min_level,
  movement_pattern = v.movement_pattern,
  equipment = v.equipment,
  is_unilateral = v.is_unilateral,
  is_explosive = v.is_explosive,
  time_based = v.time_based
from (values
  -- Seed original (50)
  ('marcha-no-lugar', 1::smallint, 'warmup', '{bodyweight}'::text[], false, false, true),
  ('agachamento-com-cadeira', 1, 'squat', '{bodyweight,chair}', false, false, false),
  ('flexao-na-parede', 1, 'push_horizontal', '{bodyweight,wall}', false, false, false),
  ('superman-deitado', 1, 'hinge', '{bodyweight}', false, false, true),
  ('elevacao-de-joelhos-no-lugar', 1, 'cardio', '{bodyweight}', false, false, true),
  ('agachamento-livre', 3, 'squat', '{bodyweight}', false, false, false),
  ('ponte-de-gluteo', 1, 'hinge', '{bodyweight}', false, false, false),
  ('superman', 1, 'hinge', '{bodyweight}', false, false, true),
  ('flexao-de-joelhos', 2, 'push_horizontal', '{bodyweight}', false, false, false),
  ('prancha-no-joelho', 1, 'core_antiext', '{bodyweight}', false, false, true),
  ('polichinelo-lento', 1, 'cardio', '{bodyweight}', false, false, true),
  ('dead-bug', 1, 'core_antiext', '{bodyweight}', false, false, false),
  ('flexao-inclinada-na-mesa', 2, 'push_horizontal', '{bodyweight,table}', false, false, false),
  ('pike-push-up', 3, 'push_vertical', '{bodyweight}', false, false, false),
  ('prancha-frontal', 3, 'core_antiext', '{bodyweight}', false, false, true),
  ('mountain-climber', 2, 'core_dyn', '{bodyweight}', false, false, false),
  ('agachamento-com-pausa', 4, 'squat', '{bodyweight}', false, false, false),
  ('avanco-alternado', 2, 'squat', '{bodyweight}', true, false, false),
  ('ponte-de-gluteo-c-pausa', 2, 'hinge', '{bodyweight}', false, false, false),
  ('agachamento-sumo', 4, 'squat', '{bodyweight}', false, false, false),
  ('circuito-3-rodadas', 3, 'cardio', '{bodyweight}', false, false, true),
  ('polichinelo', 2, 'cardio', '{bodyweight}', false, false, true),
  ('flexao-normal-no-chao', 4, 'push_horizontal', '{bodyweight}', false, false, false),
  ('flexao-diamante', 6, 'push_horizontal', '{bodyweight}', false, false, false),
  ('pike-push-up-avancado', 5, 'push_vertical', '{bodyweight}', false, false, false),
  ('prancha-c-toque-no-ombro', 5, 'core_antirot', '{bodyweight}', false, false, false),
  ('abdominal-bicicleta', 3, 'core_dyn', '{bodyweight}', false, false, false),
  ('agachamento-c-salto', 5, 'plyometric', '{bodyweight}', false, true, false),
  ('ponte-unilateral', 5, 'hinge', '{bodyweight}', true, false, false),
  ('agachamento-bulgaro', 6, 'squat', '{bodyweight,chair}', true, false, false),
  ('panturrilha-no-degrau', 1, 'hinge', '{bodyweight,step}', false, false, false),
  ('jumping-jack-20s-40s', 4, 'cardio', '{bodyweight}', false, false, true),
  ('agachamento-salto-20s-40s', 6, 'plyometric', '{bodyweight}', false, true, true),
  ('flexao-20s-40s', 5, 'push_horizontal', '{bodyweight}', false, false, true),
  ('mountain-climber-20s-40s', 5, 'cardio', '{bodyweight}', false, false, true),
  ('flexao-archer', 8, 'push_horizontal', '{bodyweight}', true, false, false),
  ('flexao-explosiva-clap', 9, 'plyometric', '{bodyweight}', false, true, false),
  ('pike-push-up-c-pes-elevados', 7, 'push_vertical', '{bodyweight,chair}', false, false, false),
  ('prancha-dinamica-cotovelo-mao', 6, 'core_antirot', '{bodyweight}', false, false, false),
  ('l-sit-negativo-cadeiras', 8, 'skill_balance', '{chair}', false, false, true),
  ('pistol-squat-assistido', 8, 'squat', '{bodyweight,wall}', true, false, false),
  ('jump-lunge-avanco-c-salto', 7, 'plyometric', '{bodyweight}', true, true, false),
  ('ponte-unilateral-extensao', 6, 'hinge', '{bodyweight}', true, false, false),
  ('bulgaro-c-pausa', 7, 'squat', '{bodyweight,chair}', true, false, false),
  ('box-jump-degrau', 6, 'plyometric', '{step}', false, true, false),
  ('burpee-completo', 7, 'cardio', '{bodyweight}', false, true, false),
  ('flexao-explosiva', 7, 'plyometric', '{bodyweight}', false, true, false),
  ('jump-squat', 5, 'plyometric', '{bodyweight}', false, true, false),
  ('v-up-abdominal', 6, 'core_dyn', '{bodyweight}', false, false, false),
  ('mountain-climber-rapido', 5, 'cardio', '{bodyweight}', false, false, true),

  -- Batch 1 Pull (12)
  ('remada-invertida-toalha-porta', 2, 'pull_horizontal', '{bodyweight,towel}', false, false, false),
  ('remada-invertida-mesa', 3, 'pull_horizontal', '{bodyweight,table}', false, false, false),
  ('remada-australiana', 5, 'pull_horizontal', '{bar}', false, false, false),
  ('archer-row', 8, 'pull_horizontal', '{bar}', true, false, false),
  ('remada-com-pausa', 6, 'pull_horizontal', '{bar}', false, false, false),
  ('dead-hang', 2, 'pull_vertical', '{bar}', false, false, true),
  ('scapular-pull', 3, 'pull_vertical', '{bar}', false, false, false),
  ('pull-up-negativo', 5, 'pull_vertical', '{bar}', false, false, false),
  ('chin-up', 6, 'pull_vertical', '{bar}', false, false, false),
  ('pull-up', 7, 'pull_vertical', '{bar}', false, false, false),
  ('archer-pull-up', 10, 'pull_vertical', '{bar}', true, false, false),
  ('muscle-up-assistido', 10, 'pull_vertical', '{bar,band}', false, true, false),

  -- Batch 1 Mobility (15)
  ('cat-cow', 1, 'mobility', '{bodyweight}', false, false, true),
  ('worlds-greatest-stretch', 1, 'mobility', '{bodyweight}', true, false, true),
  ('hip-90-90', 1, 'mobility', '{bodyweight}', true, false, true),
  ('thoracic-windmill', 1, 'mobility', '{bodyweight}', true, false, true),
  ('scapular-cars', 1, 'mobility', '{bodyweight}', false, false, true),
  ('wrist-warm-up', 1, 'mobility', '{bodyweight}', false, false, true),
  ('shin-box', 1, 'mobility', '{bodyweight}', false, false, true),
  ('jefferson-curl', 3, 'mobility', '{bodyweight}', false, false, false),
  ('downward-dog', 1, 'mobility', '{bodyweight}', false, false, true),
  ('cossack-stretch', 1, 'mobility', '{bodyweight}', true, false, true),
  ('pigeon-pose', 1, 'mobility', '{bodyweight}', true, false, true),
  ('childs-pose', 1, 'mobility', '{bodyweight}', false, false, true),
  ('spinal-twist-deitado', 1, 'mobility', '{bodyweight}', true, false, true),
  ('ankle-cars', 1, 'mobility', '{bodyweight}', false, false, true),
  ('couch-stretch', 1, 'mobility', '{bodyweight,chair}', true, false, true),

  -- Batch 1 Skills base (3)
  ('hollow-body-hold', 3, 'core_antiext', '{bodyweight}', false, false, true),
  ('tuck-l-sit', 5, 'skill_balance', '{bodyweight}', false, false, true),
  ('frog-stand', 6, 'skill_balance', '{bodyweight}', false, false, true),

  -- Batch 2 Squat/Lunge (5)
  ('cossack-squat', 6, 'squat', '{bodyweight}', true, false, false),
  ('shrimp-squat-assistido', 8, 'squat', '{bodyweight,wall}', true, false, false),
  ('skater-squat', 9, 'squat', '{bodyweight}', true, false, false),
  ('step-up-lateral-cadeira', 3, 'squat', '{chair}', true, false, false),
  ('curtsy-lunge', 4, 'squat', '{bodyweight}', true, false, false),

  -- Batch 2 Hinge (5)
  ('single-leg-rdl', 4, 'hinge', '{bodyweight}', true, false, false),
  ('good-morning', 4, 'hinge', '{bodyweight}', false, false, false),
  ('hip-thrust-unilateral', 5, 'hinge', '{bodyweight,chair}', true, false, false),
  ('nordic-curl-assistido', 9, 'hinge', '{bodyweight}', false, false, false),
  ('ponte-pes-elevados', 3, 'hinge', '{bodyweight,chair}', false, false, false),

  -- Batch 2 Core anti-ext (7)
  ('hollow-rock', 4, 'core_antiext', '{bodyweight}', false, false, false),
  ('dead-bug-braco-perna', 2, 'core_antiext', '{bodyweight}', true, false, false),
  ('dead-bug-peso', 4, 'core_antiext', '{bodyweight}', false, false, false),
  ('ab-wheel-toalha', 7, 'core_antiext', '{bodyweight,towel}', false, false, false),
  ('hollow-body-tuck', 3, 'core_antiext', '{bodyweight}', false, false, true),
  ('plank-alongado', 6, 'core_antiext', '{bodyweight}', false, false, true),
  ('plank-rkc', 5, 'core_antiext', '{bodyweight}', false, false, true),

  -- Batch 2 Core anti-rot (6)
  ('plank-com-pull', 5, 'core_antirot', '{bodyweight}', true, false, false),
  ('suitcase-hold-garrafa', 4, 'core_antirot', '{bodyweight}', true, false, true),
  ('bird-dog', 2, 'core_antirot', '{bodyweight}', true, false, false),
  ('bird-dog-conectado', 3, 'core_antirot', '{bodyweight}', true, false, false),
  ('renegade-row-garrafa', 7, 'core_antirot', '{bodyweight}', true, false, false),
  ('palof-press-toalha', 4, 'core_antirot', '{bodyweight,towel}', true, false, false),

  -- Batch 2 Core dyn (7)
  ('hanging-knee-raise', 5, 'core_dyn', '{bar}', false, false, false),
  ('hanging-leg-raise', 7, 'core_dyn', '{bar}', false, false, false),
  ('toes-to-bar-assistido', 9, 'core_dyn', '{bar}', false, false, false),
  ('reverse-crunch', 3, 'core_dyn', '{bodyweight}', false, false, false),
  ('hollow-to-arch', 5, 'core_dyn', '{bodyweight}', false, false, false),
  ('windshield-wiper-deitado', 6, 'core_dyn', '{bodyweight}', true, false, false),
  ('v-up-unilateral', 7, 'core_dyn', '{bodyweight}', true, false, false),

  -- Batch 3 Push variations (6)
  ('spiderman-push-up', 6, 'push_horizontal', '{bodyweight}', true, false, false),
  ('decline-push-up', 6, 'push_horizontal', '{bodyweight,chair}', false, false, false),
  ('hindu-push-up', 7, 'push_horizontal', '{bodyweight}', false, false, false),
  ('scapular-push-up', 2, 'push_horizontal', '{bodyweight}', false, false, false),
  ('ring-style-rows-mesa', 6, 'push_horizontal', '{bodyweight,table}', false, false, false),
  ('close-grip-push-up', 5, 'push_horizontal', '{bodyweight}', false, false, false),

  -- Batch 3 Handstand (4)
  ('wall-walk', 8, 'skill_handstand', '{bodyweight,wall}', false, false, false),
  ('handstand-parede-barriga', 6, 'skill_handstand', '{bodyweight,wall}', false, false, true),
  ('handstand-parede-costas', 7, 'skill_handstand', '{bodyweight,wall}', false, false, true),
  ('hspu-negativa', 10, 'skill_handstand', '{bodyweight,wall}', false, false, false),

  -- Batch 3 Cardio (6)
  ('high-knees', 2, 'cardio', '{bodyweight}', false, false, true),
  ('skater-jump', 6, 'plyometric', '{bodyweight}', true, true, false),
  ('shuttle-run-curto', 5, 'cardio', '{bodyweight}', false, true, false),
  ('burpee-sem-flexao', 4, 'cardio', '{bodyweight}', false, true, false),
  ('burpee-lateral', 8, 'cardio', '{bodyweight}', true, true, false),
  ('tuck-jump', 7, 'plyometric', '{bodyweight}', false, true, false),

  -- Batch 3 Skills elite (14)
  ('handstand-livre-breve', 10, 'skill_handstand', '{bodyweight}', false, false, true),
  ('pike-handstand-hold', 7, 'skill_handstand', '{bodyweight}', false, false, true),
  ('tuck-planche-hold', 8, 'skill_planche', '{bodyweight}', false, false, true),
  ('tuck-planche-avancado', 10, 'skill_planche', '{bodyweight}', false, false, true),
  ('straddle-planche-lean', 11, 'skill_planche', '{bodyweight}', false, false, true),
  ('full-l-sit', 9, 'skill_balance', '{bodyweight}', false, false, true),
  ('one-leg-l-sit', 7, 'skill_balance', '{bodyweight}', true, false, true),
  ('tuck-front-lever', 9, 'skill_lever', '{bar}', false, false, true),
  ('advanced-front-lever', 11, 'skill_lever', '{bar}', true, false, true),
  ('back-lever-tuck', 10, 'skill_lever', '{bar}', false, false, true),
  ('muscle-up-negativo', 11, 'pull_vertical', '{bar}', false, false, false),
  ('explosive-pull-up', 9, 'pull_vertical', '{bar}', false, true, false),
  ('pistol-squat', 11, 'squat', '{bodyweight}', true, false, false),
  ('one-arm-push-up', 12, 'push_horizontal', '{bodyweight}', true, false, false)
) as v(slug, min_level, movement_pattern, equipment, is_unilateral, is_explosive, time_based)
where e.slug = v.slug;

-- ============================================================
-- skill_tag: marca exercicios por skill alvo (handstand, planche, etc)
-- ============================================================

update public.exercises set skill_tag = 'handstand' where slug in (
  'wall-walk', 'handstand-parede-barriga', 'handstand-parede-costas',
  'hspu-negativa', 'pike-handstand-hold', 'handstand-livre-breve'
);

update public.exercises set skill_tag = 'planche' where slug in (
  'tuck-planche-hold', 'tuck-planche-avancado', 'straddle-planche-lean', 'frog-stand'
);

update public.exercises set skill_tag = 'muscle_up' where slug in (
  'muscle-up-assistido', 'muscle-up-negativo', 'explosive-pull-up'
);

update public.exercises set skill_tag = 'front_lever' where slug in (
  'tuck-front-lever', 'advanced-front-lever'
);

update public.exercises set skill_tag = 'back_lever' where slug in ('back-lever-tuck');

update public.exercises set skill_tag = 'l_sit' where slug in (
  'tuck-l-sit', 'one-leg-l-sit', 'full-l-sit', 'l-sit-negativo-cadeiras'
);

update public.exercises set skill_tag = 'pistol' where slug in (
  'pistol-squat', 'pistol-squat-assistido', 'shrimp-squat-assistido', 'skater-squat'
);

update public.exercises set skill_tag = 'one_arm_pushup' where slug in (
  'one-arm-push-up', 'flexao-archer'
);

-- ============================================================
-- contraindications: bloqueios por lesao ou limitacao
-- ============================================================

-- Impacto em joelho (plyo, unilateral profundo, bulgaros)
update public.exercises set contraindications = array['knee'] where slug in (
  'jump-squat', 'agachamento-c-salto', 'agachamento-salto-20s-40s',
  'jump-lunge-avanco-c-salto', 'box-jump-degrau', 'tuck-jump', 'skater-jump',
  'burpee-completo', 'burpee-lateral', 'burpee-sem-flexao',
  'pistol-squat', 'pistol-squat-assistido', 'shrimp-squat-assistido', 'skater-squat',
  'nordic-curl-assistido', 'agachamento-bulgaro', 'bulgaro-c-pausa'
);

-- Sobrecarga de ombro (handstand, one-arm, explosivo)
update public.exercises set contraindications = array['shoulder'] where slug in (
  'wall-walk', 'handstand-parede-barriga', 'handstand-parede-costas',
  'hspu-negativa', 'handstand-livre-breve', 'pike-handstand-hold',
  'pike-push-up', 'pike-push-up-avancado', 'pike-push-up-c-pes-elevados',
  'one-arm-push-up', 'flexao-archer', 'archer-pull-up',
  'muscle-up-assistido', 'muscle-up-negativo',
  'flexao-explosiva-clap', 'flexao-explosiva', 'explosive-pull-up'
);

-- Carga no punho (suporte de peso em maos em posicao avancada)
update public.exercises set contraindications = array['wrist'] where slug in (
  'frog-stand', 'tuck-planche-hold', 'tuck-planche-avancado', 'straddle-planche-lean',
  'wall-walk', 'handstand-parede-barriga', 'handstand-parede-costas',
  'hspu-negativa', 'handstand-livre-breve',
  'one-arm-push-up', 'tuck-l-sit', 'one-leg-l-sit', 'full-l-sit'
);

-- Hiperextensao/flexao lombar
update public.exercises set contraindications = array['lower_back'] where slug in (
  'nordic-curl-assistido', 'good-morning', 'jefferson-curl',
  'hollow-rock', 'hollow-to-arch', 'superman', 'superman-deitado',
  'single-leg-rdl'
);

-- ============================================================
-- alternatives: substituicoes quando exercicio nao puder ser feito
-- ============================================================

update public.exercises set alternatives = array['flexao-inclinada-na-mesa'] where slug = 'flexao-na-parede';
update public.exercises set alternatives = array['flexao-na-parede','flexao-inclinada-na-mesa'] where slug = 'flexao-de-joelhos';
update public.exercises set alternatives = array['flexao-de-joelhos','flexao-inclinada-na-mesa'] where slug = 'flexao-normal-no-chao';
update public.exercises set alternatives = array['flexao-normal-no-chao','close-grip-push-up'] where slug = 'flexao-diamante';
update public.exercises set alternatives = array['flexao-diamante','flexao-normal-no-chao'] where slug = 'flexao-archer';
update public.exercises set alternatives = array['flexao-archer','flexao-diamante'] where slug = 'one-arm-push-up';

update public.exercises set alternatives = array['pike-push-up'] where slug = 'pike-push-up-avancado';
update public.exercises set alternatives = array['pike-push-up-avancado','handstand-parede-barriga'] where slug = 'pike-push-up-c-pes-elevados';

update public.exercises set alternatives = array['pull-up-negativo','chin-up'] where slug = 'pull-up';
update public.exercises set alternatives = array['pull-up-negativo','remada-australiana'] where slug = 'chin-up';
update public.exercises set alternatives = array['chin-up','pull-up'] where slug = 'archer-pull-up';
update public.exercises set alternatives = array['muscle-up-negativo','pull-up'] where slug = 'muscle-up-assistido';

update public.exercises set alternatives = array['remada-invertida-toalha-porta'] where slug = 'remada-invertida-mesa';
update public.exercises set alternatives = array['remada-invertida-mesa'] where slug = 'remada-australiana';
update public.exercises set alternatives = array['remada-australiana'] where slug = 'archer-row';

update public.exercises set alternatives = array['agachamento-com-cadeira'] where slug = 'agachamento-livre';
update public.exercises set alternatives = array['agachamento-livre','agachamento-com-pausa'] where slug = 'agachamento-sumo';
update public.exercises set alternatives = array['avanco-alternado'] where slug = 'agachamento-bulgaro';
update public.exercises set alternatives = array['agachamento-bulgaro'] where slug = 'bulgaro-c-pausa';
update public.exercises set alternatives = array['skater-squat','pistol-squat-assistido'] where slug = 'pistol-squat';
update public.exercises set alternatives = array['shrimp-squat-assistido'] where slug = 'skater-squat';

update public.exercises set alternatives = array['jump-squat'] where slug = 'agachamento-c-salto';
update public.exercises set alternatives = array['agachamento-c-salto'] where slug = 'jump-squat';
update public.exercises set alternatives = array['flexao-explosiva'] where slug = 'flexao-explosiva-clap';
update public.exercises set alternatives = array['burpee-sem-flexao'] where slug = 'burpee-completo';

update public.exercises set alternatives = array['tuck-l-sit'] where slug = 'one-leg-l-sit';
update public.exercises set alternatives = array['one-leg-l-sit','tuck-l-sit'] where slug = 'full-l-sit';
update public.exercises set alternatives = array['frog-stand'] where slug = 'tuck-planche-hold';
update public.exercises set alternatives = array['tuck-planche-hold'] where slug = 'tuck-planche-avancado';
update public.exercises set alternatives = array['tuck-planche-avancado'] where slug = 'straddle-planche-lean';

update public.exercises set alternatives = array['handstand-parede-barriga'] where slug = 'handstand-parede-costas';
update public.exercises set alternatives = array['handstand-parede-costas','wall-walk'] where slug = 'handstand-livre-breve';
update public.exercises set alternatives = array['handstand-parede-costas'] where slug = 'hspu-negativa';

update public.exercises set alternatives = array['tuck-front-lever'] where slug = 'advanced-front-lever';
update public.exercises set alternatives = array['scapular-pull'] where slug = 'tuck-front-lever';

update public.exercises set alternatives = array['dead-bug'] where slug = 'dead-bug-braco-perna';
update public.exercises set alternatives = array['dead-bug-braco-perna'] where slug = 'dead-bug-peso';
update public.exercises set alternatives = array['hollow-body-tuck'] where slug = 'hollow-body-hold';
update public.exercises set alternatives = array['hollow-body-hold'] where slug = 'hollow-rock';

update public.exercises set alternatives = array['prancha-no-joelho'] where slug = 'prancha-frontal';
update public.exercises set alternatives = array['prancha-frontal'] where slug = 'plank-alongado';
update public.exercises set alternatives = array['prancha-frontal'] where slug = 'plank-rkc';

update public.exercises set alternatives = array['hanging-knee-raise'] where slug = 'hanging-leg-raise';
update public.exercises set alternatives = array['hanging-leg-raise'] where slug = 'toes-to-bar-assistido';
