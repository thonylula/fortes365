// Gera supabase/migrations/{N}_seed_{region}_recipes.sql a partir de
// scripts/data/{region}-recipes-curated.json e PATCHA scripts/data/{region}-recipes.json
// preenchendo `rec` nas options de slots alm/jan cujo primeiro item case com uma
// receita curada (via match_prefixes, comparação com acentos normalizados).
//
// Depois rode `node scripts/generate-meals-seed.mjs <region> <mig>` para propagar
// o rec preenchido para a migration de meals correspondente.
//
// Uso: node scripts/generate-recipes-seed.mjs <region> <migration_num>
//   ex: node scripts/generate-recipes-seed.mjs centro_oeste 0024

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const region = process.argv[2];
const migNum = process.argv[3];
if (!region || !migNum) {
  console.error(
    "uso: node scripts/generate-recipes-seed.mjs <region> <migration_num>",
  );
  console.error("ex:  node scripts/generate-recipes-seed.mjs centro_oeste 0024");
  process.exit(1);
}

const ALLOWED = ["nordeste", "sudeste", "sul", "norte", "centro_oeste"];
if (!ALLOWED.includes(region)) {
  console.error(`region invalida: ${region}. aceita: ${ALLOWED.join(", ")}`);
  process.exit(1);
}

const curatedPath = path.join(
  __dirname,
  `data/${region}-recipes-curated.json`,
);
const poolPath = path.join(__dirname, `data/${region}-recipes.json`);

const curated = JSON.parse(fs.readFileSync(curatedPath, "utf8"));
const pool = JSON.parse(fs.readFileSync(poolPath, "utf8"));

if (!Array.isArray(curated.recipes) || curated.recipes.length === 0) {
  console.error(`nenhuma receita em ${curatedPath}`);
  process.exit(1);
}

function norm(s) {
  return String(s)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Acha a receita cujo prefix normalizado mais longo case com início de item0.
// Prefixes mais específicos vencem prefixes genéricos (ex: "Moqueca de peixe light"
// vence "Moqueca de peixe (").
function matchSlug(item0, recipes) {
  const n0 = norm(item0);
  const candidates = [];
  for (const r of recipes) {
    for (const p of r.match_prefixes || []) {
      const np = norm(p);
      if (n0.startsWith(np)) candidates.push({ slug: r.slug, len: np.length });
    }
  }
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => b.len - a.len);
  return candidates[0].slug;
}

function sqlEscape(s) {
  return String(s).replace(/'/g, "''");
}

function jsonbLiteral(obj) {
  return `'${sqlEscape(JSON.stringify(obj))}'::jsonb`;
}

function nullableText(s) {
  return s == null ? "null" : `'${sqlEscape(s)}'`;
}

// ─────────────────────────────────────────────────────────────
// Fase 1: patch do pool de refeições (scripts/data/{region}-recipes.json)
// Preenche `rec` em slots alm/jan onde items[0] casar com uma receita curada.
// ─────────────────────────────────────────────────────────────
let patchedCount = 0;
let skippedCount = 0;
for (const slot of ["alm", "jan"]) {
  const slotDef = pool.slots?.[slot];
  if (!slotDef || !Array.isArray(slotDef.options)) continue;
  for (const opt of slotDef.options) {
    const item0 = (opt.items && opt.items[0]) || "";
    const slug = matchSlug(item0, curated.recipes);
    if (slug) {
      if (opt.rec !== slug) {
        opt.rec = slug;
        patchedCount++;
      }
    } else {
      skippedCount++;
    }
  }
}
fs.writeFileSync(poolPath, JSON.stringify(pool, null, 2) + "\n");
console.log(
  `[pool] ${patchedCount} options atualizadas, ${skippedCount} sem match em ${path.relative(process.cwd(), poolPath)}`,
);

// ─────────────────────────────────────────────────────────────
// Fase 2: emitir migration SQL com UPSERT em public.recipes
// ─────────────────────────────────────────────────────────────
const regionLabel = region.charAt(0).toUpperCase() + region.slice(1).replace("_", "-");
const lines = [];
lines.push(
  `-- Migration ${migNum}: seed de receitas ${regionLabel} (gerado por scripts/generate-recipes-seed.mjs)`,
);
lines.push(
  `-- ${curated.recipes.length} receitas curadas para region='${region}'. UPSERT por slug.`,
);
lines.push("");
lines.push(`delete from public.recipes where region = '${region}';`);
lines.push("");
lines.push(
  "insert into public.recipes (slug, title, icon, category, time_label, description, region, data) values",
);

const values = curated.recipes.map((r) => {
  const data = r.data || {};
  return (
    `  ('${sqlEscape(r.slug)}',` +
    ` '${sqlEscape(r.title)}',` +
    ` ${nullableText(r.icon)},` +
    ` ${nullableText(r.category)},` +
    ` ${nullableText(r.time_label)},` +
    ` ${nullableText(r.description)},` +
    ` '${region}',` +
    ` ${jsonbLiteral(data)})`
  );
});
lines.push(values.join(",\n") + ";");
lines.push("");

const outPath = path.join(
  __dirname,
  "..",
  "supabase",
  "migrations",
  `${migNum}_seed_${region}_recipes.sql`,
);
fs.writeFileSync(outPath, lines.join("\n"));
console.log(
  `[migration] ${curated.recipes.length} receitas escritas em ${path.relative(process.cwd(), outPath)}`,
);
console.log(
  `\nproximo passo: node scripts/generate-meals-seed.mjs ${region} <mig_meals>  # para propagar rec ao cardápio`,
);
