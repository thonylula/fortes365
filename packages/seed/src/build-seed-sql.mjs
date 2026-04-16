#!/usr/bin/env node
// Gera supabase/seed.sql a partir dos JSONs em packages/content/.
// Roda depois de extract.mjs. Sem dependências externas.
//
// Uso: node packages/seed/src/build-seed-sql.mjs

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../../..');
const CONTENT = resolve(ROOT, 'packages/content');
const OUT = resolve(ROOT, 'supabase/seed.sql');

const load = (name) => JSON.parse(readFileSync(resolve(CONTENT, `${name}.json`), 'utf8'));

const months = load('months');
const phases = load('phases');
const meta = load('meta');
const mealMeta = load('meal_meta');
const yearMeals = load('year_meals');
const recipes = load('recipes');
const shopBase = load('shop_base');
const shopSeasonal = load('shop_seasonal');
const foods = load('foods');

// ─────────────────────────────────────────────────────────────
// Helpers SQL
// ─────────────────────────────────────────────────────────────
const q = (v) => {
  if (v === null || v === undefined) return 'null';
  if (typeof v === 'number') return String(v);
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  return `'${String(v).replace(/'/g, "''")}'`;
};
const qj = (obj) => (obj == null ? 'null' : `'${JSON.stringify(obj).replace(/'/g, "''")}'::jsonb`);

const slugify = (s) =>
  String(s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

// Mapa deduplicado de exercícios. Chave = slug do nome.
// Quando o mesmo exercício aparece em múltiplos dias, preservamos o primeiro kcal/mod/yt vistos.
const exerciseMap = new Map();
for (let p = 0; p < phases.length; p++) {
  for (let d = 0; d < phases[p].length; d++) {
    const day = phases[p][d];
    if (!Array.isArray(day.exs)) continue;
    for (const ex of day.exs) {
      const slug = slugify(ex.n);
      if (!exerciseMap.has(slug)) {
        exerciseMap.set(slug, {
          slug,
          name: ex.n,
          muscle_group: ex.m ?? null,
          kcal_estimate: ex.kcal ?? null,
          modifier: ex.mod ?? null,
          youtube_search_url: ex.yt ?? null,
        });
      }
    }
  }
}

// ─────────────────────────────────────────────────────────────
// Emissão
// ─────────────────────────────────────────────────────────────
const out = [];
out.push('-- FORTE 365 — seed de conteúdo (gerado por packages/seed/src/build-seed-sql.mjs).');
out.push('-- Não editar à mão. Rode o gerador novamente para regenerar.');
out.push('-- Assume schema de supabase/migrations/0001_init.sql já aplicado.');
out.push('');
out.push('begin;');
out.push('');

// Limpeza idempotente (mantém usuários intactos)
out.push('-- Limpeza idempotente das tabelas de conteúdo');
out.push('truncate table public.plan_day_exercises restart identity cascade;');
out.push('truncate table public.plan_days restart identity cascade;');
out.push('truncate table public.plan_meals restart identity cascade;');
out.push('truncate table public.shopping_items restart identity cascade;');
out.push('delete from public.exercises;');
out.push('delete from public.recipes;');
out.push('delete from public.foods;');
out.push('delete from public.meal_slots;');
out.push('delete from public.week_volume;');
out.push('delete from public.phases;');
out.push('delete from public.months;');
out.push('');

// phases
out.push('-- phases');
const phaseNames = ['Iniciante', 'Básico', 'Intermediário', 'Avançado'];
for (let p = 0; p < phases.length; p++) {
  out.push(
    `insert into public.phases (id, name) values (${p}, ${q(phaseNames[p] ?? `Fase ${p}`)});`,
  );
}
out.push('');

// months
out.push('-- months');
for (let i = 0; i < months.length; i++) {
  const m = months[i];
  out.push(
    `insert into public.months (id, short_name, name, phase_label, phase_css_class, icon, level, has_bike, season) values (${i}, ${q(m.n)}, ${q(m.name)}, ${q(m.ph)}, ${q(m.pcls)}, ${q(m.icon)}, ${m.level}, ${m.hasBike ? 'true' : 'false'}, ${q(m.season)});`,
  );
}
out.push('');

// week_volume
out.push('-- week_volume');
for (let w = 0; w < meta.weekVolume.length; w++) {
  out.push(
    `insert into public.week_volume (week_index, multiplier) values (${w}, ${meta.weekVolume[w]});`,
  );
}
out.push('');

// exercises (deduplicados)
out.push(`-- exercises (${exerciseMap.size} únicos após dedupe por slug)`);
for (const ex of exerciseMap.values()) {
  out.push(
    `insert into public.exercises (slug, name, muscle_group, kcal_estimate, modifier, youtube_search_url) values (${q(ex.slug)}, ${q(ex.name)}, ${q(ex.muscle_group)}, ${q(ex.kcal_estimate)}, ${q(ex.modifier)}, ${q(ex.youtube_search_url)});`,
  );
}
out.push('');

// plan_days + plan_day_exercises (com CTE para capturar UUIDs)
out.push('-- plan_days + plan_day_exercises');
for (let p = 0; p < phases.length; p++) {
  for (let d = 0; d < phases[p].length; d++) {
    const day = phases[p][d];
    const exs = Array.isArray(day.exs) ? day.exs : [];
    const exsValues = exs
      .map((ex, idx) => {
        const slug = slugify(ex.n);
        return `(${idx}, ${q(slug)}, ${q(ex.s)}, ${q(ex.r)}, ${q(ex.rest)})`;
      })
      .join(', ');

    const insertDay = `
with new_day as (
  insert into public.plan_days (phase_id, day_index, type, focus, tip, cover_key, distance, zone, kcal_estimate, message, raw)
  values (${p}, ${d}, ${q(day.type)}, ${q(day.focus)}, ${q(day.tip)}, ${q(day.cover)}, ${q(day.dist)}, ${q(day.zona)}, ${q(day.kcal)}, ${q(day.msg)}, ${qj(day)})
  returning id
)`;

    if (exs.length === 0) {
      out.push(`${insertDay}\nselect id from new_day;`);
    } else {
      out.push(
        `${insertDay}, exs(position, slug, sets, reps, rest) as (values ${exsValues})
insert into public.plan_day_exercises (plan_day_id, exercise_id, position, sets, reps, rest)
select new_day.id, e.id, exs.position, exs.sets::smallint, exs.reps, exs.rest
from new_day cross join exs
join public.exercises e on e.slug = exs.slug;`,
      );
    }
    out.push('');
  }
}

// meal_slots
out.push('-- meal_slots');
for (const [key, slot] of Object.entries(mealMeta)) {
  out.push(
    `insert into public.meal_slots (key, title, default_time, icon, css_class) values (${q(key)}, ${q(slot.t)}, ${q(slot.time)}, ${q(slot.ico)}, ${q(slot.icoCls)});`,
  );
}
out.push('');

// plan_meals (12 meses × 7 dias × 7 slots). Guardamos data como jsonb.
out.push('-- plan_meals');
const slotOrder = ['cafe', 'lanche_m', 'almoco', 'pre', 'pos', 'jantar', 'lanche_n'];
const slotKeyByField = {
  cafe: 'cafe',
  lanche_m: 'lm',
  almoco: 'alm',
  pre: 'pre',
  pos: 'pos',
  jantar: 'jan',
  lanche_n: 'ln',
};
for (let mi = 0; mi < yearMeals.length; mi++) {
  const monthDays = yearMeals[mi];
  if (!Array.isArray(monthDays)) continue;
  for (let di = 0; di < monthDays.length; di++) {
    const day = monthDays[di];
    if (!day) continue;
    for (const field of slotOrder) {
      const meal = day[field];
      if (!meal) continue;
      out.push(
        `insert into public.plan_meals (month_id, day_index, slot_key, data) values (${mi}, ${di}, ${q(slotKeyByField[field])}, ${qj(meal)});`,
      );
    }
  }
}
out.push('');

// recipes
out.push(`-- recipes (${Object.keys(recipes).length})`);
for (const [slug, r] of Object.entries(recipes)) {
  out.push(
    `insert into public.recipes (slug, title, icon, category, time_label, description, data) values (${q(slug)}, ${q(r.nome)}, ${q(r.ico)}, ${q(r.cat)}, ${q(r.tempo)}, ${q(r.desc)}, ${qj(r)});`,
  );
}
out.push('');

// shopping_items (base)
out.push('-- shopping_items: base');
for (const cat of shopBase) {
  for (const item of cat.items) {
    out.push(
      `insert into public.shopping_items (scope, month_id, category, name, amount, raw) values ('base', null, ${q(cat.cat)}, ${q(item.n)}, ${q(item.ql ?? null)}, ${qj(item)});`,
    );
  }
}
out.push('');

// shopping_items (seasonal por mês)
out.push('-- shopping_items: seasonal');
for (const [monthId, cat] of Object.entries(shopSeasonal)) {
  for (const item of cat.items) {
    out.push(
      `insert into public.shopping_items (scope, month_id, category, name, amount, raw) values ('seasonal', ${monthId}, ${q(cat.cat)}, ${q(item.n)}, ${q(item.ql ?? null)}, ${qj(item)});`,
    );
  }
}
out.push('');

// foods
out.push('-- foods');
for (const f of foods) {
  out.push(
    `insert into public.foods (name, category, data) values (${q(f.n ?? f.name ?? 'sem nome')}, ${q(f.cat ?? f.category ?? null)}, ${qj(f)});`,
  );
}
out.push('');

out.push('commit;');
out.push('');

writeFileSync(OUT, out.join('\n'), 'utf8');

// Estatísticas
const exDayCount = phases.flat().reduce(
  (n, day) => n + (Array.isArray(day.exs) ? day.exs.length : 0),
  0,
);
const mealCount = yearMeals.flat().reduce((n, day) => {
  if (!day) return n;
  return n + slotOrder.filter((k) => day[k]).length;
}, 0);

console.log(`✓ seed.sql gerado: ${OUT}`);
console.log(`  months:               ${months.length}`);
console.log(`  phases:               ${phases.length}`);
console.log(`  plan_days:            ${phases.flat().length}`);
console.log(`  exercises (únicos):   ${exerciseMap.size}`);
console.log(`  plan_day_exercises:   ${exDayCount}`);
console.log(`  plan_meals:           ${mealCount}`);
console.log(`  recipes:              ${Object.keys(recipes).length}`);
console.log(`  shopping base items:  ${shopBase.reduce((n, c) => n + c.items.length, 0)}`);
console.log(`  shopping seasonal:    ${Object.values(shopSeasonal).reduce((n, c) => n + c.items.length, 0)}`);
console.log(`  foods:                ${foods.length}`);
