-- Migration 0029: adiciona coluna 'state' na tabela recipes
--
-- Cada receita passa a ter uma sigla de estado brasileiro (2 letras). Para as
-- 112 receitas ja cadastradas, o estado foi atribuido manualmente com base na
-- categoria/titulo/descricao. A coluna permanece nullable para nao quebrar
-- eventuais receitas customizadas do user que nao estejam nos seeds.

alter table public.recipes
  add column if not exists state text;

-- Check constraint: aceita NULL OR uma das 27 siglas
alter table public.recipes
  drop constraint if exists recipes_state_check;

alter table public.recipes
  add constraint recipes_state_check
  check (state is null or state in (
    'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
    'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'
  ));

-- ==================== BACKFILL (112 slugs) ====================

-- Centro-Oeste (region='centro_oeste')
update public.recipes set state = 'GO' where slug in (
  'arroz_com_pequi', 'galinhada_goiana', 'empadao_goiano',
  'frango_caipira_guariroba', 'galinha_caipira_ensopada',
  'frango_assado_batata_doce', 'sopa_feijao_linguica', 'canja_galinha'
);
update public.recipes set state = 'MT' where slug in (
  'mojica_de_pintado', 'costela_pantaneira', 'maria_isabel', 'bife_pantaneiro',
  'pacu_na_folha', 'caldeirada_pantaneira', 'caldo_de_piranha',
  'arroz_carne_seca', 'arroz_sua_de_porco', 'sopa_mandioca_carne_seca',
  'peixe_grelhado_legumes'
);
update public.recipes set state = 'MS' where slug in (
  'soba_campo_grande', 'soba_light'
);
update public.recipes set state = 'DF' where slug in (
  'omelete_queijo_minas'
);

-- Nordeste (region='nordeste')
update public.recipes set state = 'CE' where slug in (
  'carne_de_sol_grelhada', 'peixe_grelhado_simples', 'arrumadinho_light',
  'arrumadinho_tradicional', 'baiao_de_dois', 'cuscuz_recheado',
  'feijao_corda_pacoca', 'omelete_queijo_coalho', 'sopa_feijao_verde'
);
update public.recipes set state = 'BA' where slug in (
  'peixe_assado_nordestino', 'camarao_grelhado_alho_integral', 'canja_galinha_ne',
  'galinha_caipira_quiabo', 'peixe_molho_tomate_feijao_verde',
  'peixe_tomate_jantar', 'carne_magra_jerimum_ensopado', 'macaxeira_cozida'
);
update public.recipes set state = 'AL' where slug in (
  'escondidinho_carne_sol', 'sururu_refogado'
);
update public.recipes set state = 'MA' where slug in (
  'sopa_legumes_charque'
);
update public.recipes set state = 'PB' where slug in (
  'caldinho_feijao'
);
update public.recipes set state = 'PE' where slug in (
  'bode_assado_sertao', 'pescada_coentro_pirao_light', 'cuscuz'
);

-- Sudeste (region='sudeste')
update public.recipes set state = 'SP' where slug in (
  'bife_parmegiana_light', 'lasanha_abobrinha_light', 'macarronada_bolonhesa',
  'polenta_mole_frango_grelhado', 'quibe_assado', 'frango_molho_tomate_brocolis',
  'virado_paulista', 'quibe_assado_paulistano'
);
update public.recipes set state = 'MG' where slug in (
  'canja_galinha_sudeste', 'feijao_tropeiro', 'lombo_feijao_preto_couve',
  'frango_quiabo_mineiro', 'omelete_queijo_minas_sudeste', 'polenta_mole_tomate',
  'sopa_legumes_frango', 'frango_desfiado_pure_abobora', 'vaca_atolada',
  'pao_de_queijo'
);
update public.recipes set state = 'RJ' where slug in (
  'feijao_arroz_branco', 'peito_frango_grelhado', 'sopa_feijao_macarrao',
  'tilapia_grelhada'
);
update public.recipes set state = 'ES' where slug in (
  'moqueca_capixaba'
);

-- Norte (region='norte')
update public.recipes set state = 'PA' where slug in (
  'filhote_grelhado', 'pato_tucupi_light', 'pato_no_tucupi', 'omelete_jambu',
  'sopa_legumes_peixe', 'tacaca_completo', 'tacaca_light',
  'frango_tucupi_sem_farinha', 'camarao_tucupi_light'
);
update public.recipes set state = 'AM' where slug in (
  'pirarucu_grelhado', 'tambaqui_grelhado', 'tambaqui_brasa',
  'charque_feijao_manteiga', 'caldeirada_tucunare', 'caldeirada_tucunare_light',
  'caldinho_feijao_manteiga', 'moqueca_amazonica', 'moqueca_amazonica_light',
  'sopa_feijao_charque', 'pirarucu_grelhado_limao', 'x_caboquinho'
);

-- Sul (region='sul')
update public.recipes set state = 'RS' where slug in (
  'peixe_grelhado_sul', 'arroz_carreteiro', 'canja_galinha_sul', 'churrasco_misto',
  'costela_brasa', 'frango_assado_batata_sul', 'galeto_primo_canto',
  'patinho_batata_doce_salada', 'polenta_fortaia', 'polenta_frango',
  'sopa_agnolini', 'sopa_capeletti', 'sopa_feijao_charque_sul',
  'sopa_feijao_carne_magra'
);
update public.recipes set state = 'SC' where slug in (
  'camarao_milanesa', 'frango_arroz_pinhao_repolho', 'kassler',
  'omelete_queijo_colonial', 'arroz_frango_alecrim_pinhao_light',
  'sequencia_catarinense_light'
);
update public.recipes set state = 'PR' where slug in (
  'patinho_ensopado_polenta', 'arroz_frango_alecrim_jantar'
);

-- Index para facilitar filtros futuros por estado
create index if not exists recipes_state_idx on public.recipes (state);
