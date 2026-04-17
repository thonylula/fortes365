-- Skill Tree: Directed Acyclic Graph (DAG) para progressao de calistenia
-- Cada skill_node eh um exercicio/habilidade que o usuario pode masterizar
-- skill_edges definem pre-requisitos (parent → child)

create table if not exists public.skill_nodes (
  id serial primary key,
  slug text unique not null,
  name text not null,
  emoji text not null default '💪',
  category text not null check (category in ('push', 'pull', 'legs', 'core', 'skills', 'cardio')),
  difficulty smallint not null check (difficulty between 1 and 10),
  description text,
  exercise_slug text references public.exercises(slug),
  sort_order smallint not null default 0
);

create table if not exists public.skill_edges (
  id serial primary key,
  parent_id integer not null references public.skill_nodes(id) on delete cascade,
  child_id integer not null references public.skill_nodes(id) on delete cascade,
  unique (parent_id, child_id)
);

create table if not exists public.user_skills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  skill_id integer not null references public.skill_nodes(id) on delete cascade,
  status text not null default 'locked' check (status in ('locked', 'in_progress', 'mastered')),
  mastered_at timestamptz,
  unique (user_id, skill_id)
);

-- RLS
alter table public.skill_nodes enable row level security;
alter table public.skill_edges enable row level security;
alter table public.user_skills enable row level security;

create policy "skill_nodes_read" on public.skill_nodes for select using (true);
create policy "skill_edges_read" on public.skill_edges for select using (true);
create policy "user_skills_self" on public.user_skills for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Indexes
create index on public.user_skills (user_id);
create index on public.skill_edges (parent_id);
create index on public.skill_edges (child_id);

-- ═══════════════════════════════════════════════════════════
-- SEED: Skill Nodes (6 categorias, ~60 skills)
-- ═══════════════════════════════════════════════════════════

-- PUSH (Empurrar) — 12 skills
insert into public.skill_nodes (slug, name, emoji, category, difficulty, description, exercise_slug, sort_order) values
  ('push-wall',          'Flexao na Parede',           '🧱', 'push', 1, 'Primeiro passo. 60cm da parede, cotovelos a 45°.', 'flexao-na-parede', 1),
  ('push-incline',       'Flexao Inclinada (Mesa)',     '📐', 'push', 2, 'Maos na mesa ou bancada. Corpo reto.', 'flexao-inclinada-na-mesa', 2),
  ('push-knee',          'Flexao de Joelhos',           '🦵', 'push', 3, 'Corpo reto da cabeca aos joelhos.', 'flexao-de-joelhos', 3),
  ('push-standard',      'Flexao Normal',               '💪', 'push', 4, 'MARCO! Corpo reto, desce quase tocando o chao.', 'flexao-normal-no-chao', 4),
  ('push-diamond',       'Flexao Diamante',             '💎', 'push', 5, 'Maos formam losango. Foco no triceps.', 'flexao-diamante', 5),
  ('push-pike',          'Pike Push-up',                '⛰️', 'push', 5, 'Quadril elevado. Simula overhead press.', 'pike-push-up', 6),
  ('push-pike-elevated', 'Pike Pes Elevados',           '🏔️', 'push', 6, 'Pes na cadeira. Mais carga no ombro.', 'pike-push-up-c-pes-elevados', 7),
  ('push-archer',        'Flexao Archer',               '🏹', 'push', 7, 'Bracos bem abertos. Precursor do one-arm.', 'flexao-archer', 8),
  ('push-explosive',     'Flexao Explosiva',            '💥', 'push', 7, 'Empurra forte, mao sai do chao.', 'flexao-explosiva', 9),
  ('push-clap',          'Flexao com Palma',            '👏', 'push', 8, 'Bate palma no ar. Potencia maxima.', 'flexao-explosiva-clap', 10),
  ('push-hspu-neg',      'HSPU Negativo',               '🤸', 'push', 9, 'Parada de mao na parede, desce devagar.', null, 11),
  ('push-one-arm',       'Flexao One-Arm',              '☝️', 'push', 10, 'O objetivo final de push. Uma mao so.', null, 12);

-- PULL (Puxar) — 10 skills
insert into public.skill_nodes (slug, name, emoji, category, difficulty, description, exercise_slug, sort_order) values
  ('pull-aussie',        'Aussie Row',                  '🇦🇺', 'pull', 2, 'Barra na altura do quadril. Puxe o peito ate a barra.', null, 1),
  ('pull-negative',      'Barra Negativa',              '⬇️', 'pull', 3, 'Suba com salto, desca devagar (5s).', null, 2),
  ('pull-dead-hang',     'Dead Hang',                   '🦥', 'pull', 2, 'Segure na barra o maximo que conseguir.', null, 3),
  ('pull-chin-up',       'Chin-up (Supinada)',          '🤏', 'pull', 5, 'Palmas viradas pra voce. Mais facil que pull-up.', null, 4),
  ('pull-pullup',        'Pull-up',                     '💪', 'pull', 6, 'MARCO! Palmas viradas pra frente. Queixo acima da barra.', null, 5),
  ('pull-wide',          'Pull-up Aberta',              '🦅', 'pull', 7, 'Maos bem afastadas. Foco nas costas.', null, 6),
  ('pull-lsit-hang',     'L-Sit Hang',                  '🔲', 'pull', 7, 'Pendura na barra com pernas a 90°.', null, 7),
  ('pull-archer',        'Archer Pull-up',              '🏹', 'pull', 8, 'Um braco puxa, o outro fica estendido.', null, 8),
  ('pull-muscle-up',     'Muscle-up',                   '🏆', 'pull', 9, 'Pull-up + transicao + dip. Movimento completo.', null, 9),
  ('pull-one-arm',       'One-Arm Pull-up',             '☝️', 'pull', 10, 'O objetivo final de pull.', null, 10);

-- LEGS (Pernas) — 10 skills
insert into public.skill_nodes (slug, name, emoji, category, difficulty, description, exercise_slug, sort_order) values
  ('legs-chair-squat',   'Agachamento c/ Cadeira',      '🪑', 'legs', 1, 'Cadeira como guia. Primeiro passo.', 'agachamento-com-cadeira', 1),
  ('legs-squat',         'Agachamento Livre',            '🏋️', 'legs', 2, 'Bracos a frente. Pes na largura dos ombros.', 'agachamento-livre', 2),
  ('legs-sumo',          'Agachamento Sumo',             '🦍', 'legs', 3, 'Pes abertos, dedos pra fora. Adutores.', 'agachamento-sumo', 3),
  ('legs-pause-squat',   'Agachamento com Pausa',        '⏸️', 'legs', 4, '2s no fundo. Mais eficiente.', 'agachamento-com-pausa', 4),
  ('legs-lunge',         'Avanco Alternado',             '🚶', 'legs', 4, 'Use parede se precisar de equilibrio.', 'avanco-alternado', 5),
  ('legs-bulgarian',     'Agachamento Bulgaro',          '🇧🇬', 'legs', 6, 'Pe traseiro na cadeira. Devagar.', 'agachamento-bulgaro', 6),
  ('legs-jump-squat',    'Jump Squat',                   '🚀', 'legs', 6, 'Salto completo. Potencia.', 'jump-squat', 7),
  ('legs-jump-lunge',    'Jump Lunge',                   '⚡', 'legs', 7, 'Troca de perna no ar.', 'jump-lunge-avanco-c-salto', 8),
  ('legs-pistol-assist', 'Pistol Squat Assistido',       '🔫', 'legs', 8, 'Uma perna, segurando na parede.', 'pistol-squat-assistido', 9),
  ('legs-pistol',        'Pistol Squat',                 '🎯', 'legs', 10, 'Agachamento completo em uma perna. Sem apoio.', null, 10);

-- CORE — 10 skills
insert into public.skill_nodes (slug, name, emoji, category, difficulty, description, exercise_slug, sort_order) values
  ('core-knee-plank',    'Prancha no Joelho',            '🦵', 'core', 1, 'Costas retas. Respire normalmente.', 'prancha-no-joelho', 1),
  ('core-dead-bug',      'Dead Bug',                     '🪲', 'core', 2, 'Costas coladas no chao o tempo todo.', 'dead-bug', 2),
  ('core-plank',         'Prancha Frontal',              '🧱', 'core', 3, 'Nos pes! Cotovelos no chao. 30-60s.', 'prancha-frontal', 3),
  ('core-mountain',      'Mountain Climber',             '⛰️', 'core', 4, 'Lento e controlado. Core firme.', 'mountain-climber', 4),
  ('core-shoulder-tap',  'Prancha c/ Toque Ombro',       '👆', 'core', 5, 'Anti-rotacao. Core ultra estavel.', 'prancha-c-toque-no-ombro', 5),
  ('core-bicycle',       'Abdominal Bicicleta',          '🚲', 'core', 5, 'Cotovelo ao joelho oposto. Obliquos.', 'abdominal-bicicleta', 6),
  ('core-dynamic-plank', 'Prancha Dinamica',             '🔄', 'core', 6, 'Alterna cotovelo/mao. Core + ombro.', 'prancha-dinamica-cotovelo-mao', 7),
  ('core-v-up',          'V-Up',                         '🔺', 'core', 7, 'Sobe pernas + tronco ao mesmo tempo.', 'v-up-abdominal', 8),
  ('core-l-sit',         'L-Sit',                        '🔲', 'core', 8, 'Bracos esticados entre cadeiras. Core + triceps.', 'l-sit-negativo-cadeiras', 9),
  ('core-dragon-flag',   'Dragon Flag',                  '🐉', 'core', 10, 'Corpo reto levantado do banco. So ombros apoiados.', null, 10);

-- SKILLS (Habilidades avancadas) — 8 skills
insert into public.skill_nodes (slug, name, emoji, category, difficulty, description, exercise_slug, sort_order) values
  ('skill-handstand-wall', 'Parada de Mao (Parede)',    '🤸', 'skills', 5, 'Chute pra parede e segure.', null, 1),
  ('skill-handstand',      'Parada de Mao Livre',       '🌟', 'skills', 9, 'Sem parede. Equilibrio puro.', null, 2),
  ('skill-front-lever-tuck','Front Lever Tuck',          '🔒', 'skills', 7, 'Pernas encolhidas, corpo paralelo ao chao.', null, 3),
  ('skill-front-lever',    'Front Lever',                '🏆', 'skills', 10, 'Corpo reto, paralelo ao chao. Elite.', null, 4),
  ('skill-back-lever',     'Back Lever',                 '🔙', 'skills', 8, 'Invertido, corpo paralelo. Ombros fortes.', null, 5),
  ('skill-planche-lean',   'Planche Lean',               '↗️', 'skills', 6, 'Inclinacao pra frente nas maos. Base pra planche.', null, 6),
  ('skill-planche-tuck',   'Tuck Planche',               '🤏', 'skills', 8, 'Joelhos ao peito, corpo suspenso.', null, 7),
  ('skill-planche',        'Full Planche',               '👑', 'skills', 10, 'Corpo reto, suspenso nas maos. O auge.', null, 8);

-- CARDIO — 6 skills
insert into public.skill_nodes (slug, name, emoji, category, difficulty, description, exercise_slug, sort_order) values
  ('cardio-march',         'Marcha no Lugar',            '🚶', 'cardio', 1, 'Aquecimento basico. Joelhos ate o quadril.', 'marcha-no-lugar', 1),
  ('cardio-jumping-jack',  'Polichinelo',                '⭐', 'cardio', 2, 'Aquecimento cardiovascular completo.', 'polichinelo', 2),
  ('cardio-high-knees',    'Elevacao de Joelhos',        '🦵', 'cardio', 3, 'Cardio intenso. Core ativado.', 'elevacao-de-joelhos-no-lugar', 3),
  ('cardio-mountain-fast', 'Mountain Climber Rapido',    '🏃', 'cardio', 5, 'Ritmo maximo. Core + cardio.', 'mountain-climber-rapido', 4),
  ('cardio-burpee',        'Burpee Completo',            '🔥', 'cardio', 7, 'Flexao + salto + palma. O rei do cardio.', 'burpee-completo', 5),
  ('cardio-box-jump',      'Box Jump',                   '📦', 'cardio', 6, 'Salte sobre degrau. Explosao.', 'box-jump-degrau', 6);

-- ═══════════════════════════════════════════════════════════
-- SEED: Skill Edges (progressao DAG)
-- ═══════════════════════════════════════════════════════════

-- PUSH progressions
insert into public.skill_edges (parent_id, child_id)
select p.id, c.id from public.skill_nodes p, public.skill_nodes c where p.slug = 'push-wall' and c.slug = 'push-incline';
insert into public.skill_edges (parent_id, child_id)
select p.id, c.id from public.skill_nodes p, public.skill_nodes c where p.slug = 'push-incline' and c.slug = 'push-knee';
insert into public.skill_edges (parent_id, child_id)
select p.id, c.id from public.skill_nodes p, public.skill_nodes c where p.slug = 'push-knee' and c.slug = 'push-standard';
insert into public.skill_edges (parent_id, child_id)
select p.id, c.id from public.skill_nodes p, public.skill_nodes c where p.slug = 'push-standard' and c.slug = 'push-diamond';
insert into public.skill_edges (parent_id, child_id)
select p.id, c.id from public.skill_nodes p, public.skill_nodes c where p.slug = 'push-standard' and c.slug = 'push-pike';
insert into public.skill_edges (parent_id, child_id)
select p.id, c.id from public.skill_nodes p, public.skill_nodes c where p.slug = 'push-pike' and c.slug = 'push-pike-elevated';
insert into public.skill_edges (parent_id, child_id)
select p.id, c.id from public.skill_nodes p, public.skill_nodes c where p.slug = 'push-pike-elevated' and c.slug = 'push-hspu-neg';
insert into public.skill_edges (parent_id, child_id)
select p.id, c.id from public.skill_nodes p, public.skill_nodes c where p.slug = 'push-diamond' and c.slug = 'push-archer';
insert into public.skill_edges (parent_id, child_id)
select p.id, c.id from public.skill_nodes p, public.skill_nodes c where p.slug = 'push-standard' and c.slug = 'push-explosive';
insert into public.skill_edges (parent_id, child_id)
select p.id, c.id from public.skill_nodes p, public.skill_nodes c where p.slug = 'push-explosive' and c.slug = 'push-clap';
insert into public.skill_edges (parent_id, child_id)
select p.id, c.id from public.skill_nodes p, public.skill_nodes c where p.slug = 'push-archer' and c.slug = 'push-one-arm';

-- PULL progressions
insert into public.skill_edges (parent_id, child_id)
select p.id, c.id from public.skill_nodes p, public.skill_nodes c where p.slug = 'pull-dead-hang' and c.slug = 'pull-aussie';
insert into public.skill_edges (parent_id, child_id)
select p.id, c.id from public.skill_nodes p, public.skill_nodes c where p.slug = 'pull-aussie' and c.slug = 'pull-negative';
insert into public.skill_edges (parent_id, child_id)
select p.id, c.id from public.skill_nodes p, public.skill_nodes c where p.slug = 'pull-negative' and c.slug = 'pull-chin-up';
insert into public.skill_edges (parent_id, child_id)
select p.id, c.id from public.skill_nodes p, public.skill_nodes c where p.slug = 'pull-chin-up' and c.slug = 'pull-pullup';
insert into public.skill_edges (parent_id, child_id)
select p.id, c.id from public.skill_nodes p, public.skill_nodes c where p.slug = 'pull-pullup' and c.slug = 'pull-wide';
insert into public.skill_edges (parent_id, child_id)
select p.id, c.id from public.skill_nodes p, public.skill_nodes c where p.slug = 'pull-pullup' and c.slug = 'pull-lsit-hang';
insert into public.skill_edges (parent_id, child_id)
select p.id, c.id from public.skill_nodes p, public.skill_nodes c where p.slug = 'pull-wide' and c.slug = 'pull-archer';
insert into public.skill_edges (parent_id, child_id)
select p.id, c.id from public.skill_nodes p, public.skill_nodes c where p.slug = 'pull-archer' and c.slug = 'pull-muscle-up';
insert into public.skill_edges (parent_id, child_id)
select p.id, c.id from public.skill_nodes p, public.skill_nodes c where p.slug = 'pull-muscle-up' and c.slug = 'pull-one-arm';

-- LEGS progressions
insert into public.skill_edges (parent_id, child_id)
select p.id, c.id from public.skill_nodes p, public.skill_nodes c where p.slug = 'legs-chair-squat' and c.slug = 'legs-squat';
insert into public.skill_edges (parent_id, child_id)
select p.id, c.id from public.skill_nodes p, public.skill_nodes c where p.slug = 'legs-squat' and c.slug = 'legs-sumo';
insert into public.skill_edges (parent_id, child_id)
select p.id, c.id from public.skill_nodes p, public.skill_nodes c where p.slug = 'legs-squat' and c.slug = 'legs-pause-squat';
insert into public.skill_edges (parent_id, child_id)
select p.id, c.id from public.skill_nodes p, public.skill_nodes c where p.slug = 'legs-squat' and c.slug = 'legs-lunge';
insert into public.skill_edges (parent_id, child_id)
select p.id, c.id from public.skill_nodes p, public.skill_nodes c where p.slug = 'legs-lunge' and c.slug = 'legs-bulgarian';
insert into public.skill_edges (parent_id, child_id)
select p.id, c.id from public.skill_nodes p, public.skill_nodes c where p.slug = 'legs-pause-squat' and c.slug = 'legs-jump-squat';
insert into public.skill_edges (parent_id, child_id)
select p.id, c.id from public.skill_nodes p, public.skill_nodes c where p.slug = 'legs-bulgarian' and c.slug = 'legs-jump-lunge';
insert into public.skill_edges (parent_id, child_id)
select p.id, c.id from public.skill_nodes p, public.skill_nodes c where p.slug = 'legs-jump-squat' and c.slug = 'legs-pistol-assist';
insert into public.skill_edges (parent_id, child_id)
select p.id, c.id from public.skill_nodes p, public.skill_nodes c where p.slug = 'legs-pistol-assist' and c.slug = 'legs-pistol';

-- CORE progressions
insert into public.skill_edges (parent_id, child_id)
select p.id, c.id from public.skill_nodes p, public.skill_nodes c where p.slug = 'core-knee-plank' and c.slug = 'core-dead-bug';
insert into public.skill_edges (parent_id, child_id)
select p.id, c.id from public.skill_nodes p, public.skill_nodes c where p.slug = 'core-dead-bug' and c.slug = 'core-plank';
insert into public.skill_edges (parent_id, child_id)
select p.id, c.id from public.skill_nodes p, public.skill_nodes c where p.slug = 'core-plank' and c.slug = 'core-mountain';
insert into public.skill_edges (parent_id, child_id)
select p.id, c.id from public.skill_nodes p, public.skill_nodes c where p.slug = 'core-mountain' and c.slug = 'core-shoulder-tap';
insert into public.skill_edges (parent_id, child_id)
select p.id, c.id from public.skill_nodes p, public.skill_nodes c where p.slug = 'core-mountain' and c.slug = 'core-bicycle';
insert into public.skill_edges (parent_id, child_id)
select p.id, c.id from public.skill_nodes p, public.skill_nodes c where p.slug = 'core-shoulder-tap' and c.slug = 'core-dynamic-plank';
insert into public.skill_edges (parent_id, child_id)
select p.id, c.id from public.skill_nodes p, public.skill_nodes c where p.slug = 'core-bicycle' and c.slug = 'core-v-up';
insert into public.skill_edges (parent_id, child_id)
select p.id, c.id from public.skill_nodes p, public.skill_nodes c where p.slug = 'core-dynamic-plank' and c.slug = 'core-l-sit';
insert into public.skill_edges (parent_id, child_id)
select p.id, c.id from public.skill_nodes p, public.skill_nodes c where p.slug = 'core-l-sit' and c.slug = 'core-dragon-flag';

-- SKILLS progressions (requer skills de push + pull + core)
insert into public.skill_edges (parent_id, child_id)
select p.id, c.id from public.skill_nodes p, public.skill_nodes c where p.slug = 'push-hspu-neg' and c.slug = 'skill-handstand-wall';
insert into public.skill_edges (parent_id, child_id)
select p.id, c.id from public.skill_nodes p, public.skill_nodes c where p.slug = 'skill-handstand-wall' and c.slug = 'skill-handstand';
insert into public.skill_edges (parent_id, child_id)
select p.id, c.id from public.skill_nodes p, public.skill_nodes c where p.slug = 'pull-pullup' and c.slug = 'skill-front-lever-tuck';
insert into public.skill_edges (parent_id, child_id)
select p.id, c.id from public.skill_nodes p, public.skill_nodes c where p.slug = 'skill-front-lever-tuck' and c.slug = 'skill-front-lever';
insert into public.skill_edges (parent_id, child_id)
select p.id, c.id from public.skill_nodes p, public.skill_nodes c where p.slug = 'pull-pullup' and c.slug = 'skill-back-lever';
insert into public.skill_edges (parent_id, child_id)
select p.id, c.id from public.skill_nodes p, public.skill_nodes c where p.slug = 'push-standard' and c.slug = 'skill-planche-lean';
insert into public.skill_edges (parent_id, child_id)
select p.id, c.id from public.skill_nodes p, public.skill_nodes c where p.slug = 'skill-planche-lean' and c.slug = 'skill-planche-tuck';
insert into public.skill_edges (parent_id, child_id)
select p.id, c.id from public.skill_nodes p, public.skill_nodes c where p.slug = 'skill-planche-tuck' and c.slug = 'skill-planche';
insert into public.skill_edges (parent_id, child_id)
select p.id, c.id from public.skill_nodes p, public.skill_nodes c where p.slug = 'pull-muscle-up' and c.slug = 'skill-planche';

-- CARDIO progressions
insert into public.skill_edges (parent_id, child_id)
select p.id, c.id from public.skill_nodes p, public.skill_nodes c where p.slug = 'cardio-march' and c.slug = 'cardio-jumping-jack';
insert into public.skill_edges (parent_id, child_id)
select p.id, c.id from public.skill_nodes p, public.skill_nodes c where p.slug = 'cardio-jumping-jack' and c.slug = 'cardio-high-knees';
insert into public.skill_edges (parent_id, child_id)
select p.id, c.id from public.skill_nodes p, public.skill_nodes c where p.slug = 'cardio-high-knees' and c.slug = 'cardio-mountain-fast';
insert into public.skill_edges (parent_id, child_id)
select p.id, c.id from public.skill_nodes p, public.skill_nodes c where p.slug = 'cardio-mountain-fast' and c.slug = 'cardio-box-jump';
insert into public.skill_edges (parent_id, child_id)
select p.id, c.id from public.skill_nodes p, public.skill_nodes c where p.slug = 'cardio-box-jump' and c.slug = 'cardio-burpee';
