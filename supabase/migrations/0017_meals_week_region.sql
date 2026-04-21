-- Migration 0017: card\u00e1pio regionalizado + 48 semanas \u00fanicas no ano
-- Adiciona week_index (0..3) e region em plan_meals e recipes.
-- As 588 linhas existentes ficam com week_index=0 e region=null (fallback gen\u00e9rico
-- at\u00e9 rodar a migration 0018, que insere o seed regional nordestino).

alter table public.plan_meals
  add column if not exists week_index smallint not null default 0
    check (week_index between 0 and 3);

alter table public.plan_meals
  add column if not exists region text
    check (region in ('nordeste', 'sudeste', 'sul', 'norte', 'centro_oeste'));

-- Dropa a UNIQUE antiga (month_id, day_index, slot_key) dinamicamente
-- e cria a nova UNIQUE incluindo week_index e region.
do $$
declare
  con_name text;
begin
  select conname into con_name
  from pg_constraint
  where conrelid = 'public.plan_meals'::regclass
    and contype = 'u'
    and array_length(conkey, 1) = 3;  -- a UNIQUE antiga tinha 3 colunas
  if con_name is not null then
    execute format('alter table public.plan_meals drop constraint %I', con_name);
  end if;
end $$;

alter table public.plan_meals
  add constraint plan_meals_uniq
  unique (month_id, week_index, day_index, slot_key, region);

create index if not exists plan_meals_region_idx
  on public.plan_meals (region, month_id, week_index, day_index);

-- recipes tamb\u00e9m ganha region (null = gen\u00e9rica / dispon\u00edvel a todos)
alter table public.recipes
  add column if not exists region text
    check (region in ('nordeste', 'sudeste', 'sul', 'norte', 'centro_oeste'));
