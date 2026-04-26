-- Migration 0036: enable RLS + public read policy em forte_foods
--
-- Causa: 0035 criou a tabela forte_foods e populou com 96 alimentos, mas
-- nao habilitou RLS nem criou policy. Supabase retorna [] silenciosamente
-- pra anon/authenticated quando RLS esta off no DDL mas defaults do projeto
-- nao concedem SELECT. App nutricao/page.tsx ve foods.length === 0 e cai
-- no NoFoodsCard "Banco nutricional indisponivel" mesmo com a tabela cheia.
--
-- Fix: seguir o padrao das tabelas de referencia em 0001_init.sql (recipes,
-- shopping_items, months, exercises) — habilitar RLS + policy permissiva.
-- forte_foods e referencia global (TACO/USDA/Embrapa), nao tem dado por
-- usuario, entao using (true) e correto: qualquer um le.

alter table public.forte_foods enable row level security;

drop policy if exists "content_read_all_forte_foods" on public.forte_foods;
create policy "content_read_all_forte_foods" on public.forte_foods
  for select using (true);
