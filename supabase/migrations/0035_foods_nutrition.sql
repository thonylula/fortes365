-- Migration 0035: tabela foods com tabela nutricional por 100g
--
-- Substitui a heuristica de keyword-matching (inferFoodRole) por dados
-- nutricionais reais quando o alimento eh conhecido. Mantemos o keyword
-- matching como fallback pra alimentos nao cadastrados.
--
-- Fontes nutricionais (todas em 100g de alimento cru/cozido conforme
-- indicado em ''note''):
-- - TACO 4a ed (NEPA-Unicamp, 2011) — Tabela Brasileira de Composicao
-- - USDA FoodData Central (alimentos importados/genericos)
-- - Embrapa Frutas (frutas regionais)

create table if not exists public.forte_foods (
  slug text primary key,
  name text not null,
  category text not null check (category in (
    'protein', 'carb', 'fat', 'vegetable', 'fruit', 'dairy', 'other'
  )),
  kcal_per_100g numeric(6, 2) not null,
  protein_g numeric(5, 2) not null,
  carb_g numeric(5, 2) not null,
  fat_g numeric(5, 2) not null,
  fiber_g numeric(5, 2),
  state text, -- ''raw'' (cru), ''cooked'' (cozido), ''dried'' (seco), etc
  source text, -- ''TACO'', ''USDA'', ''Embrapa'', ...
  note text,
  created_at timestamptz not null default now()
);

create index if not exists foods_category_idx on public.forte_foods (category);

-- ─────────────────────────────────────────────────────────────────
-- Seed: 60 alimentos cobrindo o que aparece em shopping_items
-- ─────────────────────────────────────────────────────────────────

insert into public.forte_foods (slug, name, category, kcal_per_100g, protein_g, carb_g, fat_g, fiber_g, state, source, note) values
-- ── PROTEINAS ANIMAIS ──
('peito_frango', 'Peito de frango', 'protein', 165, 31, 0, 3.6, 0, 'cooked', 'TACO', 'Sem pele, grelhado'),
('coxa_frango', 'Coxa de frango', 'protein', 209, 26, 0, 11, 0, 'cooked', 'TACO', 'Sem pele'),
('frango_caipira', 'Frango caipira', 'protein', 178, 28, 0, 7, 0, 'cooked', 'TACO', 'Inteiro, sem pele'),
('patinho', 'Patinho (carne moida magra)', 'protein', 173, 33, 0, 5, 0, 'cooked', 'TACO', 'Bovino, magra'),
('alcatra', 'Alcatra', 'protein', 200, 32, 0, 8, 0, 'cooked', 'TACO', 'Bovino'),
('file_mignon', 'Filé mignon', 'protein', 195, 31, 0, 7.5, 0, 'cooked', 'TACO', 'Bovino, magro'),
('costela_bovina', 'Costela bovina', 'protein', 280, 22, 0, 22, 0, 'cooked', 'TACO', 'Com gordura'),
('lombo_porco', 'Lombo de porco', 'protein', 175, 27, 0, 6, 0, 'cooked', 'TACO', 'Magro'),
('pernil_porco', 'Pernil de porco', 'protein', 220, 26, 0, 13, 0, 'cooked', 'TACO', 'Sem couro'),
('linguica_calabresa', 'Linguiça calabresa', 'protein', 304, 18, 1.4, 25, 0, 'cooked', 'TACO', 'Defumada'),
('bacon', 'Bacon', 'protein', 541, 37, 1.4, 42, 0, 'cooked', 'TACO', 'Defumado'),
('charque', 'Charque', 'protein', 258, 36, 0, 12, 0, 'dried', 'TACO', 'Dessalgado'),
('carne_seca', 'Carne seca', 'protein', 246, 35, 0, 11, 0, 'dried', 'TACO', 'Dessalgada'),
('tilapia', 'Tilápia', 'protein', 128, 26, 0, 2.7, 0, 'cooked', 'TACO', 'Filé grelhado'),
('sardinha_fresca', 'Sardinha fresca', 'protein', 208, 25, 0, 12, 0, 'cooked', 'TACO', 'Grelhada'),
('atum_fresco', 'Atum fresco', 'protein', 184, 30, 0, 6, 0, 'cooked', 'TACO', 'Grelhado'),
('salmao', 'Salmão', 'protein', 208, 22, 0, 13, 0, 'cooked', 'USDA', 'Grelhado, com pele'),
('robalo', 'Robalo', 'protein', 124, 23, 0, 3, 0, 'cooked', 'TACO', 'Filé grelhado'),
('badejo', 'Badejo', 'protein', 110, 24, 0, 1.5, 0, 'cooked', 'TACO', 'Filé grelhado'),
('pintado', 'Pintado', 'protein', 144, 23, 0, 5, 0, 'cooked', 'TACO', 'Posta grelhada'),
('pacu', 'Pacu', 'protein', 192, 21, 0, 12, 0, 'cooked', 'Embrapa', 'Posta'),
('tambaqui', 'Tambaqui', 'protein', 167, 22, 0, 8, 0, 'cooked', 'Embrapa', 'Posta grelhada'),
('pirarucu', 'Pirarucu', 'protein', 130, 27, 0, 2, 0, 'cooked', 'Embrapa', 'Filé grelhado'),
('camarao', 'Camarão', 'protein', 99, 24, 0, 0.3, 0, 'cooked', 'USDA', 'Cozido, sem casca'),
('siri', 'Siri', 'protein', 87, 18, 0, 1.2, 0, 'cooked', 'USDA', 'Carne'),
('ostra', 'Ostras', 'protein', 81, 9, 5, 2.3, 0, 'raw', 'USDA', 'Frescas'),
('ovo_inteiro', 'Ovo de galinha', 'protein', 155, 13, 1.1, 11, 0, 'cooked', 'TACO', 'Cozido'),
('clara_ovo', 'Clara de ovo', 'protein', 52, 11, 0.7, 0.2, 0, 'cooked', 'TACO', 'Cozida'),

-- ── PROTEINAS VEGETAIS ──
('feijao_carioca', 'Feijão carioca', 'protein', 76, 4.8, 13.6, 0.5, 8.5, 'cooked', 'TACO', 'Cozido sem caldo'),
('feijao_preto', 'Feijão preto', 'protein', 77, 4.5, 14, 0.5, 8.4, 'cooked', 'TACO', 'Cozido'),
('feijao_corda', 'Feijão de corda', 'protein', 76, 4.7, 13.7, 0.5, 8, 'cooked', 'TACO', 'Cozido'),
('lentilha', 'Lentilha', 'protein', 93, 6.3, 16.3, 0.5, 7.9, 'cooked', 'TACO', 'Cozida'),
('grao_bico', 'Grão-de-bico', 'protein', 121, 8.4, 19.2, 2, 5.4, 'cooked', 'TACO', 'Cozido'),

-- ── CARBOS ──
('arroz_branco', 'Arroz branco', 'carb', 128, 2.5, 28.1, 0.2, 1.6, 'cooked', 'TACO', 'Cozido'),
('arroz_integral', 'Arroz integral', 'carb', 124, 2.6, 25.8, 1, 2.7, 'cooked', 'TACO', 'Cozido'),
('macarrao_integral', 'Macarrão integral', 'carb', 124, 5, 25, 1.1, 3.2, 'cooked', 'USDA', 'Cozido al dente'),
('batata_inglesa', 'Batata inglesa', 'carb', 87, 1.7, 20.3, 0.1, 1.8, 'cooked', 'TACO', 'Cozida'),
('batata_doce', 'Batata-doce', 'carb', 90, 2, 20.7, 0.1, 3.3, 'cooked', 'TACO', 'Cozida'),
('mandioca', 'Mandioca', 'carb', 130, 1.4, 31.4, 0.3, 1.6, 'cooked', 'TACO', 'Cozida'),
('mandioquinha', 'Mandioquinha (batata-baroa)', 'carb', 99, 1.4, 23.5, 0.2, 2.8, 'cooked', 'TACO', 'Cozida'),
('inhame', 'Inhame', 'carb', 97, 2.1, 23.2, 0.1, 4.1, 'cooked', 'TACO', 'Cozido'),
('cara', 'Cará', 'carb', 90, 1.5, 21, 0.1, 0.8, 'cooked', 'TACO', 'Cozido'),
('aveia_flocos', 'Aveia em flocos', 'carb', 394, 14, 67, 8.5, 10, 'raw', 'TACO', 'Crus'),
('quinoa', 'Quinoa', 'carb', 120, 4.4, 21.3, 1.9, 2.8, 'cooked', 'USDA', 'Cozida'),
('tapioca', 'Tapioca (goma)', 'carb', 358, 0.4, 88, 0.1, 0, 'raw', 'TACO', 'Goma de mandioca'),
('cuscuz_marroquino', 'Cuscuz marroquino', 'carb', 112, 3.8, 23, 0.2, 1.4, 'cooked', 'USDA', 'Cozido'),
('fuba_milho', 'Fubá de milho', 'carb', 365, 7.2, 79.1, 1.4, 5.5, 'raw', 'TACO', 'Cru, pra polenta'),
('canjica_branca', 'Canjica branca', 'carb', 358, 8.5, 78.6, 1, 3, 'raw', 'TACO', 'Crua'),
('quirera_milho', 'Quirera de milho', 'carb', 365, 8, 79, 1.5, 5, 'raw', 'TACO', 'Crua'),
('pao_integral', 'Pão integral', 'carb', 253, 9.4, 49.4, 3.6, 6.9, 'baked', 'TACO', 'Forma'),
('pao_frances_int', 'Pão francês integral', 'carb', 250, 8, 50, 3, 4, 'baked', 'TACO', 'Unidade'),
('banana_prata', 'Banana prata', 'carb', 89, 1.3, 22.3, 0.1, 2, 'raw', 'TACO', 'Madura'),
('banana_terra', 'Banana-da-terra', 'carb', 128, 1.3, 31.9, 0.4, 1.3, 'cooked', 'TACO', 'Cozida'),

-- ── GORDURAS ──
('azeite_extra', 'Azeite de oliva extravirgem', 'fat', 884, 0, 0, 100, 0, 'raw', 'USDA', 'Cru'),
('manteiga', 'Manteiga', 'fat', 717, 0.9, 0.1, 81, 0, 'raw', 'TACO', 'Sem sal'),
('castanha_para', 'Castanha-do-pará', 'fat', 656, 14, 12, 67, 7.9, 'raw', 'TACO', 'Crua'),
('castanha_caju', 'Castanha-de-caju', 'fat', 570, 18, 30, 46, 3.3, 'raw', 'TACO', 'Crua'),
('amendoim', 'Amendoim', 'fat', 567, 26, 16, 49, 8.5, 'raw', 'TACO', 'Cru'),
('abacate', 'Abacate', 'fat', 160, 2, 8.5, 14.7, 6.7, 'raw', 'TACO', 'Cru, polpa'),
('coco_seco', 'Coco seco', 'fat', 354, 3.3, 15.2, 33.5, 9, 'raw', 'TACO', 'Polpa'),
('leite_coco_light', 'Leite de coco light', 'fat', 47, 0.7, 1, 4.5, 0, 'cooked', 'USDA', 'Caixinha'),

-- ── LATICINIOS ──
('queijo_minas_fr', 'Queijo minas frescal', 'dairy', 240, 17, 3, 18, 0, 'raw', 'TACO', 'Light'),
('queijo_coalho', 'Queijo coalho', 'dairy', 295, 23, 1.5, 21, 0, 'raw', 'TACO', 'Grelhado'),
('iogurte_natural', 'Iogurte natural', 'dairy', 51, 4.1, 4.7, 1.5, 0, 'raw', 'TACO', 'Integral'),
('leite_desnatado', 'Leite desnatado', 'dairy', 36, 3.4, 5, 0.2, 0, 'raw', 'TACO', 'Liquido'),

-- ── VEGETAIS / VOLUME ──
('couve', 'Couve manteiga', 'vegetable', 27, 2.9, 4.3, 0.5, 3, 'cooked', 'TACO', 'Refogada'),
('brocolis', 'Brócolis', 'vegetable', 34, 2.8, 6.6, 0.4, 2.6, 'cooked', 'TACO', 'No vapor'),
('cenoura', 'Cenoura', 'vegetable', 32, 1.3, 7.7, 0.2, 3.2, 'cooked', 'TACO', 'Cozida'),
('chuchu', 'Chuchu', 'vegetable', 17, 0.5, 4, 0.1, 1.4, 'cooked', 'TACO', 'Cozido'),
('abobrinha', 'Abobrinha', 'vegetable', 17, 1.2, 3.6, 0.2, 1.1, 'cooked', 'TACO', 'Cozida'),
('quiabo', 'Quiabo', 'vegetable', 33, 1.9, 7.5, 0.2, 3.2, 'cooked', 'TACO', 'Cozido'),
('espinafre', 'Espinafre', 'vegetable', 23, 2.9, 3.6, 0.4, 2.2, 'cooked', 'TACO', 'Refogado'),
('alface', 'Alface', 'vegetable', 11, 1.4, 1.7, 0.2, 1.6, 'raw', 'TACO', 'Crespa, crua'),
('tomate', 'Tomate', 'vegetable', 18, 1.1, 3.1, 0.2, 1.2, 'raw', 'TACO', 'Cru'),
('cebola', 'Cebola', 'vegetable', 39, 1.7, 8.9, 0.2, 2.2, 'raw', 'TACO', 'Crua'),
('pimentao', 'Pimentão verde', 'vegetable', 21, 1.1, 4.9, 0.4, 2.6, 'raw', 'TACO', 'Cru'),
('repolho', 'Repolho', 'vegetable', 16, 1.4, 3.5, 0.1, 2, 'cooked', 'TACO', 'Cozido'),

-- ── FRUTAS ──
('manga', 'Manga', 'fruit', 64, 0.4, 16.7, 0.2, 2.1, 'raw', 'TACO', 'Polpa'),
('caju', 'Caju (fruta)', 'fruit', 43, 1, 11.6, 0.3, 1.7, 'raw', 'Embrapa', 'Polpa'),
('umbu', 'Umbu', 'fruit', 44, 0.7, 11, 0.2, 1.6, 'raw', 'Embrapa', 'Polpa'),
('graviola', 'Graviola', 'fruit', 62, 1, 15.8, 0.3, 1.9, 'raw', 'Embrapa', 'Polpa'),
('pitanga', 'Pitanga', 'fruit', 41, 0.9, 9.4, 0.2, 3.2, 'raw', 'Embrapa', 'Polpa'),
('caja', 'Cajá', 'fruit', 50, 0.7, 12.4, 0.3, 1.9, 'raw', 'Embrapa', 'Polpa'),
('maracuja', 'Maracujá', 'fruit', 68, 2, 12.3, 2.1, 1.1, 'raw', 'TACO', 'Polpa'),
('seriguela', 'Seriguela', 'fruit', 64, 0.9, 15.7, 0.4, 2, 'raw', 'Embrapa', 'Polpa'),
('jaca', 'Jaca', 'fruit', 95, 1.7, 24.4, 0.6, 1.5, 'raw', 'TACO', 'Polpa'),
('goiaba', 'Goiaba', 'fruit', 52, 0.9, 13.6, 0.5, 6.2, 'raw', 'TACO', 'Polpa'),
('laranja', 'Laranja', 'fruit', 37, 0.9, 8.9, 0.1, 1.8, 'raw', 'TACO', 'Polpa'),
('mandarina', 'Mandarina (tangerina)', 'fruit', 38, 0.8, 9.6, 0.2, 0.9, 'raw', 'TACO', 'Polpa'),
('mamao', 'Mamão papaya', 'fruit', 40, 0.5, 10.4, 0.1, 1, 'raw', 'TACO', 'Polpa'),
('melancia', 'Melancia', 'fruit', 33, 0.9, 8.1, 0.2, 0.1, 'raw', 'TACO', 'Polpa'),
('uva', 'Uva', 'fruit', 53, 0.7, 13.6, 0.2, 0.9, 'raw', 'TACO', 'Italia'),
('acerola', 'Acerola', 'fruit', 33, 0.9, 7.7, 0.2, 1.5, 'raw', 'Embrapa', 'Polpa'),
('cupuacu', 'Cupuaçu', 'fruit', 49, 1.7, 10.4, 0.6, 4, 'raw', 'Embrapa', 'Polpa'),
('acai', 'Açaí', 'fruit', 58, 0.8, 6.2, 3.9, 2.6, 'raw', 'Embrapa', 'Polpa'),
('pequi', 'Pequi', 'fruit', 250, 3, 13, 21, 8, 'raw', 'Embrapa', 'Polpa, gorduroso')
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
  note = excluded.note;
