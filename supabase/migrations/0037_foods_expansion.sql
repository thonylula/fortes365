-- Migration 0037: expansao de forte_foods + suporte a unidades naturais
--
-- Resolve o problema de cobertura de 14% em /nutricao causado por:
-- 1. ~50 alimentos faltando no banco (whey, iogurte proteico, pao de queijo,
--    canja, vatapa, baiao de dois, frutas regionais, peixes regionais, etc)
-- 2. Parser de foods.ts so reconhece quantidade em g/kg/ml/l. Items tipo
--    "1 ovo cozido", "1 banana", "1 col sopa azeite" eram ignorados.
--
-- Solucao em 3 partes:
-- A. Nova coluna unit_weight_g: peso medio de uma unidade do alimento
--    (ovo=50g, banana=120g, mama=200g). Usado pelo parser pra converter
--    "X [food]" em "X*peso_medio g".
-- B. ~50 novos alimentos cobrindo compostos brasileiros + suplementos +
--    frutas/proteinas/laticinios regionais.
-- C. Update de unit_weight_g pra alimentos existentes (frutas, ovo, pao).
--
-- Fontes:
-- - TACO 4a ed (NEPA-Unicamp, 2011)
-- - TBCA-USP (Tabela Brasileira de Composicao de Alimentos, USP/FORC, 2023)
--   https://www.fcf.usp.br/tbca/
-- - USDA FoodData Central (suplementos, alimentos importados)
-- - Embrapa Frutas (frutas regionais Norte/NE)
-- - Pesos medios: USDA Food Portion Sizes + TBCA Medidas Caseiras

-- ─────────────────────────────────────────────────────────────────────────
-- A. Adiciona coluna unit_weight_g
-- ─────────────────────────────────────────────────────────────────────────
alter table public.forte_foods
  add column if not exists unit_weight_g numeric(5, 2);

comment on column public.forte_foods.unit_weight_g is
  'Peso medio em gramas de uma unidade do alimento (ovo=50, banana=120). Permite ao parser converter "1 ovo" em "50g" sem unidade explicita. NULL = nao discreto.';

-- ─────────────────────────────────────────────────────────────────────────
-- B. Insere ~50 alimentos novos
-- ─────────────────────────────────────────────────────────────────────────
insert into public.forte_foods (slug, name, category, kcal_per_100g, protein_g, carb_g, fat_g, fiber_g, state, source, note, unit_weight_g) values

-- ── SUPLEMENTOS / FUNCIONAIS ──
('whey_concentrado', 'Whey protein concentrado', 'protein', 380, 75, 8, 4, 0, 'raw', 'USDA', '1 scoop = 30g', 30),
('whey_isolado', 'Whey protein isolado', 'protein', 360, 90, 1, 1, 0, 'raw', 'USDA', '1 scoop = 30g', 30),
('iogurte_proteico', 'Iogurte proteico (light)', 'dairy', 60, 10, 4, 0, 0, 'raw', 'USDA', 'Tipo proteinado de mercado', 170),
('iogurte_grego', 'Iogurte grego natural', 'dairy', 95, 9, 4, 5, 0, 'raw', 'USDA', 'Sem aucar', 170),
('cottage', 'Queijo cottage', 'dairy', 100, 11, 3, 5, 0, 'raw', 'USDA', 'Light', NULL),
('ricota_fresca', 'Ricota fresca', 'dairy', 174, 11, 3, 13, 0, 'raw', 'TACO', 'Light', NULL),
('leite_integral', 'Leite integral', 'dairy', 61, 3.2, 4.7, 3.2, 0, 'raw', 'TACO', 'Liquido', NULL),

-- ── PROTEINAS REGIONAIS ──
('carne_sol', 'Carne de sol', 'protein', 250, 35, 0, 12, 0, 'cooked', 'TACO', 'Dessalgada e desfiada', NULL),
('bode', 'Bode (carne magra)', 'protein', 143, 27, 0, 3, 0, 'cooked', 'TACO', 'Magro, cozido', NULL),
('cabrito', 'Cabrito', 'protein', 165, 24, 0, 7, 0, 'cooked', 'TACO', 'Assado', NULL),
('galeto', 'Galeto', 'protein', 215, 23, 0, 13, 0, 'cooked', 'TACO', 'Assado', NULL),
('moela', 'Moela de frango', 'protein', 135, 24, 0, 4, 0, 'cooked', 'TACO', 'Cozida', NULL),
('figado_galinha', 'Figado de galinha', 'protein', 165, 24, 1, 7, 0, 'cooked', 'TACO', 'Refogado', NULL),
('corvina', 'Corvina', 'protein', 100, 21, 0, 1.7, 0, 'cooked', 'TBCA-USP', 'File grelhado', NULL),
('tainha', 'Tainha', 'protein', 145, 22, 0, 6, 0, 'cooked', 'TBCA-USP', 'Posta grelhada', NULL),
('cacao_peixe', 'Cacao (peixe)', 'protein', 130, 22, 0, 4, 0, 'cooked', 'TBCA-USP', 'File grelhado', NULL),
('tucunare', 'Tucunare', 'protein', 95, 22, 0, 1.5, 0, 'cooked', 'Embrapa', 'File grelhado', NULL),
('surubim', 'Surubim', 'protein', 102, 22, 0, 1.5, 0, 'cooked', 'Embrapa', 'Posta grelhada', NULL),
('dourado_rio', 'Dourado (rio)', 'protein', 130, 22, 0, 5, 0, 'cooked', 'Embrapa', 'Posta grelhada', NULL),
('polvo', 'Polvo', 'protein', 82, 15, 2, 1, 0, 'cooked', 'USDA', 'Cozido', NULL),
('lula', 'Lula', 'protein', 92, 16, 3, 1.4, 0, 'cooked', 'USDA', 'Grelhada', NULL),
('mexilhao', 'Mexilhao', 'protein', 86, 12, 4, 2, 0, 'cooked', 'USDA', 'Cozido', NULL),
('sururu', 'Sururu', 'protein', 95, 16, 4, 1.5, 0, 'cooked', 'TBCA-USP', 'Cozido', NULL),

-- ── COMPOSTOS BRASILEIROS (TBCA-USP receitas medias) ──
('canja_galinha', 'Canja de galinha (caldo c/ frango+arroz+legumes)', 'other', 65, 4, 8, 1.5, 0.5, 'cooked', 'TBCA-USP', 'Receita media, ~250g por porcao', 250),
('cuscuz_nordestino_leite', 'Cuscuz nordestino c/ leite', 'carb', 130, 4, 22, 3, 1.2, 'cooked', 'TBCA-USP', 'Flocao+leite+manteiga, porcao tipica', 200),
('cuscuz_paulista', 'Cuscuz paulista', 'carb', 145, 5, 25, 3, 1, 'cooked', 'TBCA-USP', 'C/ legumes', 150),
('baiao_de_dois', 'Baiao de dois', 'other', 155, 7, 22, 4, 3.5, 'cooked', 'TBCA-USP', 'Feijao verde+arroz+queijo coalho', 250),
('vatapa', 'Vatapa', 'other', 145, 8, 12, 8, 1, 'cooked', 'TBCA-USP', 'Camarao+pao+coco+amendoim', 200),
('acaraje', 'Acaraje', 'other', 320, 10, 18, 24, 4, 'cooked', 'TBCA-USP', 'Massa de feijao fradinho frita', 80),
('moqueca_capixaba', 'Moqueca capixaba (peixe)', 'other', 110, 12, 5, 6, 1, 'cooked', 'TBCA-USP', 'Sem dende', 250),
('moqueca_baiana', 'Moqueca baiana', 'other', 145, 11, 5, 9, 1, 'cooked', 'TBCA-USP', 'C/ leite de coco e dende', 250),
('bobo_camarao', 'Bobo de camarao', 'other', 170, 8, 14, 9, 1.5, 'cooked', 'TBCA-USP', 'Aipim+camarao+coco', 250),
('tutu_feijao', 'Tutu de feijao', 'other', 110, 5, 17, 2.5, 4, 'cooked', 'TBCA-USP', 'Mineiro', 200),
('feijoada_light', 'Feijoada light', 'other', 165, 11, 14, 6, 5, 'cooked', 'TBCA-USP', 'C/ partes magras', 350),
('galinhada', 'Galinhada', 'other', 165, 11, 22, 4, 1, 'cooked', 'TBCA-USP', 'Frango+arroz+acafrao', 300),
('estrogonofe_frango', 'Estrogonofe de frango', 'other', 180, 12, 8, 11, 0.5, 'cooked', 'TBCA-USP', 'Receita light', 200),
('estrogonofe_carne', 'Estrogonofe de carne', 'other', 200, 13, 6, 13, 0.5, 'cooked', 'TBCA-USP', 'Receita light', 200),
('risoto_frango', 'Risoto de frango', 'other', 175, 10, 25, 4, 1, 'cooked', 'TBCA-USP', 'Light', 250),
('pirao', 'Pirao', 'carb', 110, 4, 22, 1, 0.8, 'cooked', 'TBCA-USP', 'C/ caldo de peixe', 150),
('farofa_simples', 'Farofa simples', 'carb', 350, 4, 70, 5, 4, 'cooked', 'TBCA-USP', 'Farinha+manteiga+ovo', 30),
('mungunza_doce', 'Mungunza doce', 'other', 145, 4, 28, 2, 1.5, 'cooked', 'TBCA-USP', 'Canjica c/ leite+coco+aucar', 200),
('pamonha_doce', 'Pamonha doce', 'other', 195, 5, 32, 5, 1.8, 'cooked', 'TBCA-USP', 'C/ aucar+leite', 200),
('caldo_verde', 'Caldo verde', 'other', 60, 2, 8, 1.5, 1.5, 'cooked', 'TBCA-USP', 'Couve+batata+linguica', 250),
('crepioca', 'Crepioca (1 unidade)', 'other', 150, 8, 22, 3, 0.5, 'cooked', 'TBCA-USP', 'Tapioca+ovo', 80),
('tapioca_recheada_queijo', 'Tapioca recheada c/ queijo', 'other', 180, 6, 30, 4, 0.3, 'cooked', 'TBCA-USP', 'Pequena/media', 100),
('tapioca_recheada_frango', 'Tapioca recheada c/ frango', 'other', 195, 11, 28, 4, 0.5, 'cooked', 'TBCA-USP', 'Pequena/media', 120),
('vitamina_banana_aveia', 'Vitamina de banana c/ aveia', 'other', 110, 4, 20, 1.5, 1.8, 'raw', 'TBCA-USP', 'Banana+leite+aveia', 300),
('omelete_basico', 'Omelete basico (2 ovos)', 'protein', 175, 13, 1, 13, 0, 'cooked', 'TBCA-USP', 'C/ tempero, sem queijo', 110),
('pao_queijo', 'Pao de queijo', 'other', 290, 5, 35, 14, 0.8, 'baked', 'TBCA-USP', 'Pequeno', 30),
('beiju', 'Beiju de tapioca', 'carb', 280, 0.5, 70, 0.2, 0.2, 'cooked', 'TBCA-USP', 'Sem recheio', 80),

-- ── FRUTAS ADICIONAIS ──
('morango', 'Morango', 'fruit', 30, 0.9, 7, 0.3, 1.5, 'raw', 'TACO', 'Polpa fresca', 12),
('abacaxi', 'Abacaxi', 'fruit', 48, 0.9, 12, 0.1, 1, 'raw', 'TACO', 'Polpa fresca', 100),
('caqui', 'Caqui chocolate', 'fruit', 70, 0.6, 18, 0.2, 6.5, 'raw', 'TACO', 'Polpa', 168),
('figo_fresco', 'Figo fresco', 'fruit', 74, 0.8, 19, 0.3, 2.9, 'raw', 'TACO', 'Polpa', 50),
('pera', 'Pera', 'fruit', 57, 0.4, 15, 0.1, 3.1, 'raw', 'TACO', 'C/ casca', 165),
('pessego', 'Pessego', 'fruit', 36, 0.8, 9, 0.1, 1.5, 'raw', 'TACO', 'Polpa', 130),
('ameixa_fresca', 'Ameixa fresca', 'fruit', 53, 0.8, 13, 0.6, 1.4, 'raw', 'TACO', 'Polpa', 60),
('ameixa_seca', 'Ameixa seca', 'fruit', 240, 2.2, 64, 0.4, 7, 'dried', 'USDA', 'Sem caroco', 8),
('tamara', 'Tamara', 'fruit', 282, 2.4, 75, 0.4, 8, 'dried', 'USDA', 'Polpa', 7),
('damasco_seco', 'Damasco seco', 'fruit', 240, 3.4, 63, 0.5, 7.3, 'dried', 'USDA', 'Polpa', 6),
('uva_passa', 'Uva passa', 'fruit', 299, 3.1, 79, 0.5, 3.7, 'dried', 'USDA', 'Polpa', 1),
('jabuticaba', 'Jabuticaba', 'fruit', 58, 0.7, 14, 0.4, 2.3, 'raw', 'TBCA-USP', 'Polpa', 5),
('pinhao_cozido', 'Pinhao cozido', 'fat', 174, 4, 32, 4, 4.6, 'cooked', 'TACO', 'Sem casca', 4),
('buriti', 'Buriti', 'fruit', 250, 2, 12, 22, 11, 'raw', 'Embrapa', 'Polpa', 50),
('bacuri', 'Bacuri', 'fruit', 105, 1.2, 24, 0.8, 3, 'raw', 'Embrapa', 'Polpa', 60),
('tucuma', 'Tucuma', 'fruit', 245, 4, 12, 21, 7, 'raw', 'Embrapa', 'Polpa', 30),
('pupunha_cozida', 'Pupunha cozida', 'fruit', 184, 3.3, 36, 3, 4.8, 'cooked', 'Embrapa', 'C/ sal', 80),

-- ── OLEAGINOSAS / SEMENTES ──
('amendoa', 'Amendoa crua', 'fat', 575, 21, 22, 50, 12, 'raw', 'USDA', 'Sem casca', 1.2),
('nozes', 'Nozes', 'fat', 654, 15, 14, 65, 6.7, 'raw', 'USDA', 'Sem casca', 5),
('pistache', 'Pistache', 'fat', 562, 20, 28, 45, 10, 'raw', 'USDA', 'Sem casca', 0.7),
('chia', 'Semente de chia', 'fat', 486, 17, 42, 31, 34, 'raw', 'USDA', 'Crua', NULL),
('linhaca', 'Linhaca', 'fat', 534, 18, 29, 42, 27, 'raw', 'USDA', 'Crua', NULL),
('gergelim', 'Gergelim', 'fat', 573, 18, 23, 50, 12, 'raw', 'TACO', 'Cru ou torrado', NULL),
('pasta_amendoim', 'Pasta de amendoim', 'fat', 588, 25, 20, 50, 6, 'raw', 'USDA', 'Integral', NULL),
('tahine', 'Tahine (pasta de gergelim)', 'fat', 595, 17, 21, 53, 9.3, 'raw', 'USDA', 'Integral', NULL),

-- ── CARBOIDRATOS / FARINHAS / GRAOS ──
('aveia_farelo', 'Farelo de aveia', 'carb', 246, 17, 66, 7, 15, 'raw', 'USDA', 'Cru', NULL),
('granola_integral', 'Granola integral', 'carb', 470, 11, 65, 16, 7, 'raw', 'TBCA-USP', 'Sem aucar', NULL),
('farinha_mandioca', 'Farinha de mandioca', 'carb', 365, 1.6, 87, 0.3, 6.5, 'raw', 'TACO', 'Crua', NULL),
('farinha_aveia', 'Farinha de aveia', 'carb', 405, 14, 67, 8, 9, 'raw', 'TACO', 'Crua', NULL),
('farinha_coco', 'Farinha de coco', 'carb', 400, 18, 60, 13, 39, 'raw', 'USDA', 'Crua', NULL),
('polvilho_doce', 'Polvilho doce', 'carb', 380, 0, 95, 0, 0, 'raw', 'TACO', 'Cru', NULL),
('polvilho_azedo', 'Polvilho azedo', 'carb', 380, 0, 95, 0, 0, 'raw', 'TACO', 'Cru', NULL),
('biscoito_polvilho', 'Biscoito de polvilho', 'carb', 458, 4, 70, 18, 1, 'baked', 'TACO', 'Pequeno', 3),
('torrada_integral', 'Torrada integral', 'carb', 380, 12, 72, 5, 8, 'baked', 'TACO', 'Unidade', 12),
('pao_forma_branco', 'Pao de forma branco', 'carb', 265, 8, 50, 3, 2.5, 'baked', 'TACO', 'Fatia', 25),
('pao_frances', 'Pao frances', 'carb', 300, 8, 58, 3.1, 2.3, 'baked', 'TACO', 'Unidade', 50),
('arroz_parboilizado', 'Arroz parboilizado', 'carb', 130, 2.6, 28, 0.3, 1.8, 'cooked', 'TACO', 'Cozido', NULL),

-- ── DOCES / ADOCANTES ──
('mel', 'Mel de abelha', 'carb', 304, 0.3, 82, 0, 0.2, 'raw', 'TACO', 'Liquido', NULL),
('acucar_branco', 'Acucar refinado', 'carb', 387, 0, 100, 0, 0, 'raw', 'TACO', 'Cristal', NULL),
('acucar_mascavo', 'Acucar mascavo', 'carb', 369, 0, 95, 0, 0, 'raw', 'TACO', 'Cristal', NULL),
('cacau_po', 'Cacau em po (100%)', 'fat', 228, 19, 58, 14, 33, 'raw', 'USDA', 'Sem aucar', NULL),
('chocolate_70', 'Chocolate 70% cacau', 'fat', 598, 8, 46, 43, 11, 'raw', 'USDA', '1 quadradinho ~5g', 5),

-- ── BEBIDAS (~0 kcal mas marcam como matched) ──
('cafe_preto', 'Cafe preto coado', 'other', 2, 0.1, 0.4, 0, 0, 'cooked', 'TACO', 'S/ aucar', 50),
('chimarrao', 'Chimarrao', 'other', 1, 0, 0, 0, 0, 'raw', 'TACO', 'Erva mate s/ aucar', 200),
('cha_verde', 'Cha verde', 'other', 1, 0, 0.2, 0, 0, 'raw', 'USDA', 'S/ aucar', 200)

on conflict (slug) do update set
  name = excluded.name,
  category = excluded.category,
  kcal_per_100g = excluded.kcal_per_100g,
  protein_g = excluded.protein_g,
  carb_g = excluded.carb_g,
  fat_g = excluded.fat_g,
  fiber_g = excluded.fiber_g,
  state = excluded.state,
  source = excluded.source,
  note = excluded.note,
  unit_weight_g = excluded.unit_weight_g;

-- ─────────────────────────────────────────────────────────────────────────
-- C. Update unit_weight_g pra alimentos existentes (frutas, ovos, paes)
-- ─────────────────────────────────────────────────────────────────────────
update public.forte_foods set unit_weight_g = 50 where slug = 'ovo_inteiro' and unit_weight_g is null;
update public.forte_foods set unit_weight_g = 30 where slug = 'clara_ovo' and unit_weight_g is null;
update public.forte_foods set unit_weight_g = 100 where slug = 'banana_prata' and unit_weight_g is null;
update public.forte_foods set unit_weight_g = 130 where slug = 'banana_terra' and unit_weight_g is null;
update public.forte_foods set unit_weight_g = 200 where slug = 'manga' and unit_weight_g is null;
update public.forte_foods set unit_weight_g = 80 where slug = 'caju' and unit_weight_g is null;
update public.forte_foods set unit_weight_g = 50 where slug = 'umbu' and unit_weight_g is null;
update public.forte_foods set unit_weight_g = 200 where slug = 'graviola' and unit_weight_g is null;
update public.forte_foods set unit_weight_g = 8 where slug = 'pitanga' and unit_weight_g is null;
update public.forte_foods set unit_weight_g = 100 where slug = 'caja' and unit_weight_g is null;
update public.forte_foods set unit_weight_g = 60 where slug = 'maracuja' and unit_weight_g is null;
update public.forte_foods set unit_weight_g = 30 where slug = 'seriguela' and unit_weight_g is null;
update public.forte_foods set unit_weight_g = 250 where slug = 'jaca' and unit_weight_g is null;
update public.forte_foods set unit_weight_g = 150 where slug = 'goiaba' and unit_weight_g is null;
update public.forte_foods set unit_weight_g = 130 where slug = 'laranja' and unit_weight_g is null;
update public.forte_foods set unit_weight_g = 80 where slug = 'mandarina' and unit_weight_g is null;
update public.forte_foods set unit_weight_g = 300 where slug = 'mamao' and unit_weight_g is null;
update public.forte_foods set unit_weight_g = 200 where slug = 'melancia' and unit_weight_g is null;
update public.forte_foods set unit_weight_g = 5 where slug = 'uva' and unit_weight_g is null;
update public.forte_foods set unit_weight_g = 5 where slug = 'acerola' and unit_weight_g is null;
update public.forte_foods set unit_weight_g = 200 where slug = 'cupuacu' and unit_weight_g is null;
update public.forte_foods set unit_weight_g = 100 where slug = 'acai' and unit_weight_g is null;
update public.forte_foods set unit_weight_g = 50 where slug = 'pequi' and unit_weight_g is null;
update public.forte_foods set unit_weight_g = 50 where slug = 'pao_integral' and unit_weight_g is null;
update public.forte_foods set unit_weight_g = 50 where slug = 'pao_frances_int' and unit_weight_g is null;

-- Index pra acelerar lookups por slug com unit_weight_g
create index if not exists foods_slug_unit_weight_idx on public.forte_foods (slug) where unit_weight_g is not null;

-- RLS ja habilitado em 0036, novos rows herdam policy permissiva content_read_all_forte_foods
