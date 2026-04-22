-- Migration 0030: mais exercicios de aquecimento no catalogo
--
-- O catalogo hoje so tinha 'marcha-no-lugar' com movement_pattern='warmup'.
-- Outros exercicios comumente usados como aquecimento (polichinelo,
-- polichinelo-lento, joelhos-altos) estavam como 'cardio', o que os
-- empurrava pro fim do datalist do modal "Adicionar exercicio".
--
-- Esta migration:
-- 1. Promove 3 exercicios existentes a warmup
-- 2. Adiciona 6 novos aquecimentos classicos ao catalogo

-- 1. Promocao
update public.exercises
   set movement_pattern = 'warmup'
 where slug in ('polichinelo', 'polichinelo-lento', 'high-knees');

-- 2. Novos aquecimentos (ON CONFLICT DO NOTHING pra ser idempotente)
insert into public.exercises
  (slug, name, muscle_group, kcal_estimate, modifier, youtube_search_url, movement_pattern)
values
  (
    'circulos-de-braco',
    'Círculos de Braço',
    'Ombros · Aquecimento',
    5,
    'Circulos amplos, 10 pra frente + 10 pra tras.',
    'https://www.youtube.com/results?search_query=c%C3%ADrculos%20de%20bra%C3%A7o%20aquecimento',
    'warmup'
  ),
  (
    'balanco-de-perna',
    'Balanço de Perna',
    'Pernas · Aquecimento',
    8,
    'Segure apoio. 10 balancos pra frente e 10 laterais cada perna.',
    'https://www.youtube.com/results?search_query=leg%20swings%20aquecimento',
    'warmup'
  ),
  (
    'pular-corda',
    'Pular Corda',
    'Full Body · Cardio',
    50,
    'Pulos baixos e ritmados. Substitua a corda se nao tiver.',
    'https://www.youtube.com/results?search_query=pular%20corda%20aquecimento',
    'warmup'
  ),
  (
    'elevacao-de-calcanhar',
    'Elevação de Calcanhar',
    'Panturrilha · Aquecimento',
    8,
    'Suba na ponta dos pes e desca controlado.',
    'https://www.youtube.com/results?search_query=eleva%C3%A7%C3%A3o%20de%20calcanhar%20aquecimento',
    'warmup'
  ),
  (
    'rotacao-de-tronco-em-pe',
    'Rotação de Tronco',
    'Core · Aquecimento',
    10,
    'Pes afastados na largura dos quadris. Gire olhando sobre o ombro.',
    'https://www.youtube.com/results?search_query=rota%C3%A7%C3%A3o%20de%20tronco%20aquecimento',
    'warmup'
  ),
  (
    'inchworm',
    'Lagarta (Inchworm)',
    'Full Body · Aquecimento',
    15,
    'Caminhe com as maos ate prancha, desca devagar, volte.',
    'https://www.youtube.com/results?search_query=inchworm%20exercise%20warmup',
    'warmup'
  )
on conflict (slug) do nothing;
