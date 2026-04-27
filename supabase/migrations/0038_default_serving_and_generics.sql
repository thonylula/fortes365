-- Migration 0038: porcao default + genericos pra items sem quantidade
--
-- Problema: items como "Arroz branco cozido", "Folhas verdes c/ tomate",
-- "Peito de frango desfiado cozido", "1 fruta", "Folhas de vinagreira"
-- nao casam porque o parser atual exige quantidade explicita (g/kg/ml/l)
-- ou unit (col sopa, ovos, etc).
--
-- Solucao em 3 partes:
-- A. Nova coluna default_serving_g: porcao tipica em gramas pra itens
--    sem quantidade explicita (semanticamente diferente de unit_weight_g
--    que e peso de UMA unidade discreta).
-- B. ~20 alimentos genericos (fruta_generica, salada_verde, etc) com
--    default_serving_g pra cobrir items vagos do cardapio.
-- C. UPDATE default_serving_g pros alimentos comuns que aparecem sem
--    quantidade: arroz cozido, peito_frango, feijao, etc.
--
-- Fontes:
-- - TBCA-USP Medidas Caseiras (porcoes brasileiras tipicas)
-- - USDA Food Portion Sizes
-- - Open Food Facts (medias de produtos comerciais brasileiros)

-- ─────────────────────────────────────────────────────────────────────────
-- A. Nova coluna default_serving_g
-- ─────────────────────────────────────────────────────────────────────────
alter table public.forte_foods
  add column if not exists default_serving_g numeric(5, 2);

comment on column public.forte_foods.default_serving_g is
  'Porcao tipica em gramas quando o item da refeicao nao traz quantidade explicita (ex: "Arroz branco cozido" sem g/kg). Distinto de unit_weight_g (peso de UMA unidade discreta).';

-- ─────────────────────────────────────────────────────────────────────────
-- B. Genericos pra items vagos do cardapio
-- ─────────────────────────────────────────────────────────────────────────
insert into public.forte_foods (slug, name, category, kcal_per_100g, protein_g, carb_g, fat_g, fiber_g, state, source, note, unit_weight_g, default_serving_g) values

-- Frutas/saladas/verduras genericas (quando o cardapio diz "1 fruta", "salada verde")
('fruta_generica', 'Fruta (média brasileira)', 'fruit', 55, 0.7, 13, 0.3, 1.5, 'raw', 'TBCA-USP', 'Media ponderada de banana/maca/laranja/manga/mamao', 120, 120),
('salada_verde', 'Salada verde (folhas + tomate + pepino)', 'vegetable', 15, 1, 3, 0.2, 1.5, 'raw', 'TBCA-USP', 'Media de salada mista crua', 80, 80),
('folhas_verdes', 'Folhas verdes refogadas/cruas', 'vegetable', 22, 2.4, 3.8, 0.4, 2.5, 'cooked', 'TBCA-USP', 'Media couve/espinafre/agriao/rucula', 70, 70),
('legumes_cozidos', 'Legumes cozidos sortidos', 'vegetable', 35, 1.5, 7, 0.3, 2.5, 'cooked', 'TBCA-USP', 'Media cenoura/abobrinha/chuchu/brocolis', 100, 100),

-- Caldos / sopas genericas
('caldo_galinha', 'Caldo de galinha simples', 'other', 25, 2, 3, 0.8, 0, 'cooked', 'TBCA-USP', 'Sem massa, so caldo', 200, 200),
('caldo_carne', 'Caldo de carne simples', 'other', 28, 2.5, 2, 1.2, 0, 'cooked', 'TBCA-USP', 'Sem massa, so caldo', 200, 200),
('sopa_legumes', 'Sopa de legumes', 'other', 50, 2, 8, 1, 1.5, 'cooked', 'TBCA-USP', 'Receita media', 250, 250),

-- Bebidas / agua / temperos (kcal desprezivel mas marcam como matched)
('agua', 'Água', 'other', 0, 0, 0, 0, 0, 'raw', 'TBCA-USP', 'Mineral ou filtrada', 200, 200),
('agua_coco', 'Água de coco', 'other', 22, 0.5, 5.3, 0.1, 0, 'raw', 'TACO', 'Natural', 200, 250),
('suco_natural', 'Suco natural de fruta', 'other', 45, 0.5, 11, 0.2, 0.3, 'raw', 'TBCA-USP', 'Media polpa+agua, sem aucar', 200, 200),
('tempero_verde', 'Tempero verde (alho, cebola, coentro, cebolinha)', 'other', 5, 0.3, 1, 0.05, 0.5, 'raw', 'TBCA-USP', 'Marcador, kcal desprezivel', 5, 5),
('limao', 'Limão (suco)', 'other', 6, 0.1, 1.5, 0, 0, 'raw', 'TACO', 'Suco fresco', 5, 10),

-- Sanduiches / lanches genericos compostos
('sanduiche_natural', 'Sanduíche natural (frango+pão+alface+tomate)', 'other', 175, 12, 22, 4, 1.5, 'cooked', 'TBCA-USP', 'Receita media, ~150g', 150, 150),
('cafe_com_leite', 'Café com leite', 'other', 30, 2, 3, 1, 0, 'cooked', 'TBCA-USP', 'Sem aucar, ~50/50 cafe e leite', 200, 200),

-- Frutas brasileiras adicionais (apareceram nos cardapios)
('pitomba', 'Pitomba', 'fruit', 70, 1, 16, 0.3, 2, 'raw', 'TBCA-USP', 'Polpa, regional NE', 8, 50),
('siriguela', 'Siriguela', 'fruit', 64, 0.9, 15.7, 0.4, 2, 'raw', 'Embrapa', 'Polpa, regional NE', 30, 100),
('vinagreira', 'Vinagreira (folha)', 'vegetable', 33, 1.7, 7.4, 0.4, 2.7, 'cooked', 'TBCA-USP', 'Folhas branqueadas, base do cuxa MA', 50, 80),

-- Pratos compostos genericos comuns (Open Food Facts brasileiros)
('arroz_cozido_generico', 'Arroz cozido (qualquer tipo)', 'carb', 130, 2.5, 28, 0.3, 1.6, 'cooked', 'TACO', 'Quando nao especifica branco/integral/parboilizado', 100, 100),
('frango_grelhado_generico', 'Frango grelhado/desfiado', 'protein', 165, 31, 0, 4, 0, 'cooked', 'TACO', 'Generico quando nao especifica peito/coxa/caipira', 120, 120)

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
  unit_weight_g = excluded.unit_weight_g,
  default_serving_g = excluded.default_serving_g;

-- ─────────────────────────────────────────────────────────────────────────
-- C. Update default_serving_g pros alimentos comuns sem quantidade
-- Fonte: TBCA-USP Medidas Caseiras (porcoes brasileiras tipicas)
-- ─────────────────────────────────────────────────────────────────────────

-- Carbs (porcao tipica = 4 col sopa = ~100g)
update public.forte_foods set default_serving_g = 100 where slug = 'arroz_branco' and default_serving_g is null;
update public.forte_foods set default_serving_g = 100 where slug = 'arroz_integral' and default_serving_g is null;
update public.forte_foods set default_serving_g = 100 where slug = 'arroz_parboilizado' and default_serving_g is null;
update public.forte_foods set default_serving_g = 120 where slug = 'macarrao_integral' and default_serving_g is null;
update public.forte_foods set default_serving_g = 130 where slug = 'batata_inglesa' and default_serving_g is null;
update public.forte_foods set default_serving_g = 130 where slug = 'batata_doce' and default_serving_g is null;
update public.forte_foods set default_serving_g = 100 where slug = 'mandioca' and default_serving_g is null;
update public.forte_foods set default_serving_g = 100 where slug = 'mandioquinha' and default_serving_g is null;
update public.forte_foods set default_serving_g = 100 where slug = 'inhame' and default_serving_g is null;
update public.forte_foods set default_serving_g = 100 where slug = 'cara' and default_serving_g is null;
update public.forte_foods set default_serving_g = 30 where slug = 'aveia_flocos' and default_serving_g is null;
update public.forte_foods set default_serving_g = 100 where slug = 'quinoa' and default_serving_g is null;
update public.forte_foods set default_serving_g = 60 where slug = 'tapioca' and default_serving_g is null;
update public.forte_foods set default_serving_g = 100 where slug = 'cuscuz_marroquino' and default_serving_g is null;
update public.forte_foods set default_serving_g = 50 where slug = 'pao_integral' and default_serving_g is null;
update public.forte_foods set default_serving_g = 50 where slug = 'pao_frances_int' and default_serving_g is null;

-- Proteinas (porcao tipica adulto = ~120g)
update public.forte_foods set default_serving_g = 120 where slug = 'peito_frango' and default_serving_g is null;
update public.forte_foods set default_serving_g = 120 where slug = 'coxa_frango' and default_serving_g is null;
update public.forte_foods set default_serving_g = 120 where slug = 'frango_caipira' and default_serving_g is null;
update public.forte_foods set default_serving_g = 120 where slug = 'patinho' and default_serving_g is null;
update public.forte_foods set default_serving_g = 120 where slug = 'alcatra' and default_serving_g is null;
update public.forte_foods set default_serving_g = 120 where slug = 'file_mignon' and default_serving_g is null;
update public.forte_foods set default_serving_g = 100 where slug = 'costela_bovina' and default_serving_g is null;
update public.forte_foods set default_serving_g = 120 where slug = 'lombo_porco' and default_serving_g is null;
update public.forte_foods set default_serving_g = 120 where slug = 'pernil_porco' and default_serving_g is null;
update public.forte_foods set default_serving_g = 120 where slug = 'tilapia' and default_serving_g is null;
update public.forte_foods set default_serving_g = 120 where slug = 'sardinha_fresca' and default_serving_g is null;
update public.forte_foods set default_serving_g = 120 where slug = 'atum_fresco' and default_serving_g is null;
update public.forte_foods set default_serving_g = 120 where slug = 'salmao' and default_serving_g is null;
update public.forte_foods set default_serving_g = 120 where slug = 'robalo' and default_serving_g is null;
update public.forte_foods set default_serving_g = 120 where slug = 'badejo' and default_serving_g is null;
update public.forte_foods set default_serving_g = 120 where slug = 'pintado' and default_serving_g is null;
update public.forte_foods set default_serving_g = 120 where slug = 'pacu' and default_serving_g is null;
update public.forte_foods set default_serving_g = 120 where slug = 'tambaqui' and default_serving_g is null;
update public.forte_foods set default_serving_g = 120 where slug = 'pirarucu' and default_serving_g is null;
update public.forte_foods set default_serving_g = 100 where slug = 'camarao' and default_serving_g is null;
update public.forte_foods set default_serving_g = 80 where slug = 'siri' and default_serving_g is null;
update public.forte_foods set default_serving_g = 100 where slug = 'ostra' and default_serving_g is null;
update public.forte_foods set default_serving_g = 50 where slug = 'ovo_inteiro' and default_serving_g is null;
update public.forte_foods set default_serving_g = 60 where slug = 'clara_ovo' and default_serving_g is null;
update public.forte_foods set default_serving_g = 120 where slug = 'feijao_carioca' and default_serving_g is null;
update public.forte_foods set default_serving_g = 120 where slug = 'feijao_preto' and default_serving_g is null;
update public.forte_foods set default_serving_g = 120 where slug = 'feijao_corda' and default_serving_g is null;
update public.forte_foods set default_serving_g = 120 where slug = 'lentilha' and default_serving_g is null;
update public.forte_foods set default_serving_g = 120 where slug = 'grao_bico' and default_serving_g is null;

-- Laticinios
update public.forte_foods set default_serving_g = 30 where slug = 'queijo_minas_fr' and default_serving_g is null;
update public.forte_foods set default_serving_g = 30 where slug = 'queijo_coalho' and default_serving_g is null;
update public.forte_foods set default_serving_g = 170 where slug = 'iogurte_natural' and default_serving_g is null;
update public.forte_foods set default_serving_g = 200 where slug = 'leite_desnatado' and default_serving_g is null;

-- Vegetais (porcao tipica grande pq sao volume baixo de kcal)
update public.forte_foods set default_serving_g = 80 where slug = 'couve' and default_serving_g is null;
update public.forte_foods set default_serving_g = 80 where slug = 'brocolis' and default_serving_g is null;
update public.forte_foods set default_serving_g = 70 where slug = 'cenoura' and default_serving_g is null;
update public.forte_foods set default_serving_g = 100 where slug = 'chuchu' and default_serving_g is null;
update public.forte_foods set default_serving_g = 100 where slug = 'abobrinha' and default_serving_g is null;
update public.forte_foods set default_serving_g = 80 where slug = 'quiabo' and default_serving_g is null;
update public.forte_foods set default_serving_g = 80 where slug = 'espinafre' and default_serving_g is null;
update public.forte_foods set default_serving_g = 50 where slug = 'alface' and default_serving_g is null;
update public.forte_foods set default_serving_g = 50 where slug = 'tomate' and default_serving_g is null;
update public.forte_foods set default_serving_g = 30 where slug = 'cebola' and default_serving_g is null;
update public.forte_foods set default_serving_g = 50 where slug = 'pimentao' and default_serving_g is null;
update public.forte_foods set default_serving_g = 80 where slug = 'repolho' and default_serving_g is null;

-- Gorduras (porcao tipica pequena)
update public.forte_foods set default_serving_g = 5 where slug = 'azeite_extra' and default_serving_g is null;
update public.forte_foods set default_serving_g = 10 where slug = 'manteiga' and default_serving_g is null;
update public.forte_foods set default_serving_g = 15 where slug = 'castanha_para' and default_serving_g is null;
update public.forte_foods set default_serving_g = 15 where slug = 'castanha_caju' and default_serving_g is null;
update public.forte_foods set default_serving_g = 20 where slug = 'amendoim' and default_serving_g is null;
update public.forte_foods set default_serving_g = 100 where slug = 'abacate' and default_serving_g is null;
update public.forte_foods set default_serving_g = 30 where slug = 'coco_seco' and default_serving_g is null;

-- RLS ja cobre forte_foods desde 0036, novos rows herdam policy permissiva

-- Index pra acelerar lookups por default_serving_g
create index if not exists foods_default_serving_idx on public.forte_foods (slug) where default_serving_g is not null;
