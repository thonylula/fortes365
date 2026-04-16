#!/usr/bin/env node
// Extrai as constantes de conteúdo do forte365_v2.html e grava como JSONs
// em packages/content/. Roda sem dependências externas (só Node >= 18).
//
// Uso: node packages/seed/src/extract.mjs
//
// O HTML guarda os dados como literais JS dentro do <script> principal.
// Em vez de regex frágil, fatiamos o bloco de declarações (linhas 269–1320)
// e avaliamos em vm.runInNewContext com stubs para o que o browser fornece
// (document, window). As constantes viram variáveis no sandbox e de lá
// são serializadas para disco.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../../..');
const HTML_PATH = resolve(ROOT, 'forte365_v2.html');
const OUT_DIR = resolve(ROOT, 'packages/content');

const START_LINE = 269; // após <script>, início de YT =
const END_LINE = 1320;  // fecha RECIPES com `};`

const raw = readFileSync(HTML_PATH, 'utf8');
const lines = raw.split(/\r?\n/);
const slice = lines.slice(START_LINE - 1, END_LINE).join('\n');

const EXPECTED = [
  'COVERS', 'COVER_GRADS', 'MONTHS', 'WVOL', 'DL', 'DA', 'PD',
  'SEASONS', 'MM', 'YEAR_MEALS', 'FOODS', 'SHOP_BASE', 'SHOP_SEASONAL', 'RECIPES',
];

// `const` em vm.runInContext fica em escopo lexical e não aparece no sandbox.
// Envolvemos tudo numa função que retorna um objeto com as referências.
const wrapped = `(function(){\n${slice}\nreturn {${EXPECTED.join(',')}};\n})()`;

const sandbox = {
  encodeURIComponent,
  console,
  document: {
    getElementById: () => ({
      style: {},
      classList: { toggle: () => {}, add: () => {}, remove: () => {} },
      innerHTML: '',
    }),
    querySelectorAll: () => [],
  },
  window: {},
};
vm.createContext(sandbox);
const extracted = vm.runInContext(wrapped, sandbox, { filename: 'forte365_v2.html#script' });
for (const k of EXPECTED) sandbox[k] = extracted[k];

const missing = EXPECTED.filter((k) => sandbox[k] == null);
if (missing.length) {
  console.error('Constantes ausentes no sandbox:', missing);
  process.exit(1);
}

mkdirSync(OUT_DIR, { recursive: true });

const write = (name, data) => {
  const path = resolve(OUT_DIR, `${name}.json`);
  writeFileSync(path, JSON.stringify(data, null, 2) + '\n', 'utf8');
  return path;
};

// Agrupamentos lógicos que serão o input do seeder SQL.
const bundle = {
  meta: write('meta', {
    covers: sandbox.COVERS,
    coverGrads: sandbox.COVER_GRADS,
    weekVolume: sandbox.WVOL,
    dayLabelsLong: sandbox.DL,
    dayLabelsShort: sandbox.DA,
  }),
  months: write('months', sandbox.MONTHS),
  phases: write('phases', sandbox.PD),
  seasons: write('seasons', sandbox.SEASONS),
  mealMeta: write('meal_meta', sandbox.MM),
  yearMeals: write('year_meals', sandbox.YEAR_MEALS),
  foods: write('foods', sandbox.FOODS),
  shopBase: write('shop_base', sandbox.SHOP_BASE),
  shopSeasonal: write('shop_seasonal', sandbox.SHOP_SEASONAL),
  recipes: write('recipes', sandbox.RECIPES),
};

// Estatísticas para smoke-test rápido.
const phaseCount = sandbox.PD.length;
const daysPerPhase = sandbox.PD.map((ph) => ph.length);
const exerciseTotal = sandbox.PD.flat().reduce(
  (n, day) => n + (Array.isArray(day.exs) ? day.exs.length : 0),
  0,
);
const yearMealsShape = [sandbox.YEAR_MEALS.length, sandbox.YEAR_MEALS[0]?.length ?? 0];
const recipeCount = Object.keys(sandbox.RECIPES).length;

console.log('✓ Extração concluída.');
console.log(`  fases:          ${phaseCount}`);
console.log(`  dias/fase:      ${daysPerPhase.join(', ')}`);
console.log(`  exercícios:     ${exerciseTotal}`);
console.log(`  year_meals:     ${yearMealsShape[0]} meses × ${yearMealsShape[1]} dias`);
console.log(`  receitas:       ${recipeCount}`);
console.log(`  meses:          ${sandbox.MONTHS.length}`);
console.log('');
console.log('Arquivos gerados:');
for (const [k, p] of Object.entries(bundle)) console.log(`  ${k.padEnd(14)} ${p}`);
