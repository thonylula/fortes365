// Gera supabase/migrations/{N}_seed_{region}_meals.sql a partir de
// scripts/data/{region}-recipes.json. Emite 2.352 linhas (12 meses x 4 semanas
// x 7 dias x 7 slots) para plan_meals com region={region}.
// Pseudo-determin\u00edstico: a mesma entrada gera sempre a mesma sa\u00edda.
//
// Uso: node scripts/generate-meals-seed.mjs <region> <migration_num>
//   ex: node scripts/generate-meals-seed.mjs sudeste 0019

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const region = process.argv[2];
const migNum = process.argv[3];
if (!region || !migNum) {
  console.error("uso: node scripts/generate-meals-seed.mjs <region> <migration_num>");
  console.error("ex:  node scripts/generate-meals-seed.mjs sudeste 0019");
  process.exit(1);
}

const ALLOWED = ["nordeste", "sudeste", "sul", "norte", "centro_oeste"];
if (!ALLOWED.includes(region)) {
  console.error(`region invalida: ${region}. aceita: ${ALLOWED.join(", ")}`);
  process.exit(1);
}

const pool = JSON.parse(
  fs.readFileSync(path.join(__dirname, `data/${region}-recipes.json`), "utf8"),
);

const SLOTS = ["cafe", "lm", "alm", "pre", "pos", "jan", "ln"];
// Primos coprimos com o tamanho esperado de cada pool; garantem varia\u00e7\u00e3o
// forte entre dias consecutivos sem colis\u00f5es chatas.
const PRIMES = { cafe: 3, lm: 7, alm: 7, pre: 5, pos: 5, jan: 7, ln: 3 };

function sqlEscape(s) {
  return String(s).replace(/'/g, "''");
}

function jsonbLiteral(obj) {
  return `'${sqlEscape(JSON.stringify(obj))}'::jsonb`;
}

function eligible(options, monthId) {
  return options.filter(
    (o) => !o.months || o.months.length === 0 || o.months.includes(monthId),
  );
}

const regionLabel = region.charAt(0).toUpperCase() + region.slice(1).replace("_", "-");
const lines = [];
lines.push(
  `-- Migration ${migNum}: seed card\u00e1pio ${regionLabel} (gerado por scripts/generate-meals-seed.mjs)`,
);
lines.push(
  `-- 12 meses x 4 semanas x 7 dias x 7 slots = 2.352 linhas em plan_meals (region='${region}').`,
);
lines.push(
  "-- 48 combina\u00e7\u00f5es (month, week) distintas no ano; 336 day-menus \u00fanicos.",
);
lines.push("");
lines.push(
  `delete from public.plan_meals where region = '${region}';`,
);
lines.push("");

let count = 0;
const valuesBatch = [];
const BATCH = 50;

function flushBatch() {
  if (valuesBatch.length === 0) return;
  lines.push(
    "insert into public.plan_meals (month_id, week_index, day_index, slot_key, region, data) values",
  );
  lines.push(valuesBatch.join(",\n") + ";");
  lines.push("");
  valuesBatch.length = 0;
}

for (let month = 0; month < 12; month++) {
  for (let week = 0; week < 4; week++) {
    for (let day = 0; day < 7; day++) {
      const dayNum = month * 28 + week * 7 + day;
      for (const slot of SLOTS) {
        const slotDef = pool.slots[slot];
        if (!slotDef) throw new Error(`slot desconhecido: ${slot}`);
        const opts = eligible(slotDef.options, month);
        if (opts.length === 0) {
          throw new Error(
            `sem op\u00e7\u00f5es eleg\u00edveis: slot=${slot} month=${month}`,
          );
        }
        const idx = (dayNum * PRIMES[slot]) % opts.length;
        const opt = opts[idx];
        const data = {
          t: slotDef.meta.t,
          ico: slotDef.meta.ico,
          time: slotDef.meta.time,
          items: opt.items,
          ptl: `~${opt.kcal}kcal`,
          ptj: "",
          rec: opt.rec ?? null,
        };
        valuesBatch.push(
          `  (${month}, ${week}, ${day}, '${slot}', '${region}', ${jsonbLiteral(data)})`,
        );
        count++;
        if (valuesBatch.length >= BATCH) flushBatch();
      }
    }
  }
}
flushBatch();

const outPath = path.join(
  __dirname,
  "..",
  "supabase",
  "migrations",
  `${migNum}_seed_${region}_meals.sql`,
);
fs.writeFileSync(outPath, lines.join("\n"));
console.log(`OK: ${count} linhas escritas em ${path.relative(process.cwd(), outPath)}`);
