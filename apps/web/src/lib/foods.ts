/**
 * Helpers pra trabalhar com a tabela `public.foods` (migration 0035).
 * Faz lookup fuzzy de items das listas de compras / refeições contra
 * a tabela nutricional, e converte a `category` da food em `role`
 * usado pelo scaler de macros.
 */

export type FoodCategory =
  | "protein"
  | "carb"
  | "fat"
  | "vegetable"
  | "fruit"
  | "dairy"
  | "other";

export type Food = {
  slug: string;
  name: string;
  category: FoodCategory;
  kcal_per_100g: number;
  protein_g: number;
  carb_g: number;
  fat_g: number;
  fiber_g?: number | null;
  state?: string | null;
  source?: string | null;
  note?: string | null;
  /**
   * Peso medio em gramas de uma unidade discreta do alimento (ovo=50,
   * banana=120, mama=200). Usado pelo parser pra entender "1 ovo cozido"
   * sem g/kg explicito. Null = nao tem unidade discreta natural.
   */
  unit_weight_g?: number | null;
};

/**
 * Normaliza string pra comparação: minúsculas, sem acentos, sem
 * pontuação, espaços colapsados.
 */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Faz lookup fuzzy de um nome de item de receita/compra contra a tabela
 * de foods. Retorna o melhor match ou null.
 *
 * Heurística:
 * 1. Substring exata do nome do item contém o nome da food (Tilápia
 *    grelhada → "tilápia"). Privilegia matches mais longos.
 * 2. Inverso: nome da food contém o do item (food = "Peito de frango",
 *    item = "frango"). Mais permissivo.
 *
 * Empate: pega a food com nome mais curto (mais específico).
 */
export function findFoodByName(itemName: string, foods: Food[]): Food | null {
  const target = normalize(itemName);
  if (!target) return null;

  let bestMatch: Food | null = null;
  let bestScore = 0;

  for (const food of foods) {
    const candidate = normalize(food.name);
    if (!candidate) continue;

    let score = 0;
    if (target.includes(candidate)) {
      // food name é substring do item — match forte
      score = candidate.length * 2;
    } else if (candidate.includes(target)) {
      // item é substring do food — match mais fraco
      score = target.length;
    } else {
      // tenta match por primeira palavra (ex: "tilapia grelhada" vs "tilapia")
      const firstWord = target.split(" ")[0];
      const firstFoodWord = candidate.split(" ")[0];
      if (firstWord && firstWord === firstFoodWord && firstWord.length >= 4) {
        score = firstWord.length;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = food;
    }
  }

  return bestMatch;
}

/**
 * Mapeia a `category` da tabela foods pra o `role` usado pelo scaler.
 * - dairy é tratado como protein (queijo/iogurte são sources de proteína
 *   nesse contexto fitness)
 * - vegetable/fruit/other → volume (não escala, comer à vontade)
 */
export function roleFromCategory(c: FoodCategory): "protein" | "carb" | "fat" | "volume" {
  if (c === "protein" || c === "dairy") return "protein";
  if (c === "carb") return "carb";
  if (c === "fat") return "fat";
  return "volume";
}

/**
 * Calcula calorias e macros pra uma quantidade específica do alimento.
 * Aceita string em gramas/kg ("200g", "1.2kg") ou unidades discretas
 * ("3 unidades" — assume valor médio do alimento).
 */
export function nutritionForQuantity(
  food: Food,
  quantityText: string,
): { kcal: number; protein_g: number; carb_g: number; fat_g: number } | null {
  // Match: "200g", "1,2kg", "30ml" etc
  const m = quantityText.match(/^([\d]+(?:[.,]\d+)?)\s*(kg|g|ml|l)\b/i);
  if (!m) return null;
  const num = parseFloat(m[1].replace(",", "."));
  const unit = m[2].toLowerCase();
  let grams: number;
  if (unit === "kg" || unit === "l") grams = num * 1000;
  else grams = num; // g, ml — assume densidade ~1 pra leite/azeite (boa aprox.)

  const factor = grams / 100;
  return {
    kcal: Math.round(food.kcal_per_100g * factor),
    protein_g: +(food.protein_g * factor).toFixed(1),
    carb_g: +(food.carb_g * factor).toFixed(1),
    fat_g: +(food.fat_g * factor).toFixed(1),
  };
}

/**
 * Tabela de pesos médios por unidade culinária (TBCA-USP Medidas Caseiras
 * + USDA Food Portion Sizes). Usada quando o item da refeição expressa a
 * quantidade em unidade natural ("1 col sopa azeite") em vez de gramas.
 *
 * Match é case-insensitive e tolera variações comuns ("col sopa" /
 * "colher de sopa" / "colher sopa", etc).
 */
const IMPLICIT_UNIT_GRAMS: Array<{ pattern: RegExp; grams: number; label: string }> = [
  // Colher de sopa: ~15g de seco/grão; ~13ml de óleo
  { pattern: /col(?:her)?\s*(?:de\s+)?sopa/i, grams: 15, label: "col sopa" },
  // Colher de chá: ~5g
  { pattern: /col(?:her)?\s*(?:de\s+)?(?:cha|chá|ch)\b/i, grams: 5, label: "col cha" },
  // Colher de café: ~3g (menor que chá)
  { pattern: /col(?:her)?\s*(?:de\s+)?(?:cafe|café)/i, grams: 3, label: "col cafe" },
  // Fatia: ~30g (pão, queijo, frios)
  { pattern: /fatias?\b/i, grams: 30, label: "fatia" },
  // Torrada: ~12g
  { pattern: /torradas?\b/i, grams: 12, label: "torrada" },
  // Scoop (whey): ~30g
  { pattern: /scoops?\b/i, grams: 30, label: "scoop" },
  // Copo: 200ml ~= 200g (densidade de líquido aquoso)
  { pattern: /copos?\b/i, grams: 200, label: "copo" },
  // Bowl/tigela: ~250g
  { pattern: /bowls?\b|tigelas?\b/i, grams: 250, label: "bowl" },
  // Xícara: ~150g (sólidos) ou 240ml (líquidos) — uso 150 como meio termo
  { pattern: /x[ií]caras?\b/i, grams: 150, label: "xicara" },
  // Punhado: ~30g (oleaginosas, frutas secas)
  { pattern: /punhados?\b/i, grams: 30, label: "punhado" },
  // Concha: ~80ml (sopa, caldo)
  { pattern: /conchas?\b/i, grams: 80, label: "concha" },
  // Posta (peixe): ~120g
  { pattern: /postas?\b/i, grams: 120, label: "posta" },
];

/**
 * Parse de um item de refeição (string) pra extrair (food, quantidade)
 * usável pelo nutritionForQuantity. Tenta em 3 níveis (cada um mais
 * permissivo que o anterior):
 *
 * 1. Quantidade explícita em g/kg/ml/l:
 *    - "Tilápia grelhada (200g)"
 *    - "Tilápia grelhada (L:200g)" (com initial após personalizar)
 *    - "200g tilápia grelhada"
 *
 * 2. Unidade culinária implícita (TBCA-USP):
 *    - "1 col sopa azeite" → 15g azeite
 *    - "2 fatias pao integral" → 60g pao
 *    - "1 scoop whey" → 30g whey
 *
 * 3. "X [food]" usando o unit_weight_g cadastrado no próprio food:
 *    - "1 ovo cozido" → 50g (ovo_inteiro.unit_weight_g = 50)
 *    - "2 bananas" → 200g (banana_prata.unit_weight_g = 100)
 *    - "1 manga espada" → 200g (manga.unit_weight_g = 200)
 *
 * Retorna null se não casar em nenhum nível.
 */
export function parseMealItem(
  itemString: string,
  foods: Food[],
): { food: Food; quantity: string } | null {
  // Nível 1: quantidade explícita em g/kg/ml/l
  let qtyMatch = itemString.match(/\(\s*(?:[A-Za-zÀ-ÿ]+\s*:\s*)?([\d.,]+\s*(?:kg|g|ml|l))\b/i);
  if (!qtyMatch) {
    qtyMatch = itemString.match(/([\d.,]+\s*(?:kg|g|ml|l))\b/i);
  }
  if (qtyMatch) {
    const namePart = itemString.replace(/\s*\(.*?\)/g, "").trim();
    const food = findFoodByName(namePart, foods);
    if (!food) return null;
    return { food, quantity: qtyMatch[1].replace(/\s+/g, "") };
  }

  // Nível 2: unidade culinária implícita ("1 col sopa azeite", "2 fatias pao")
  for (const unit of IMPLICIT_UNIT_GRAMS) {
    // Captura "X <unit> Y" onde Y é o nome do alimento
    const re = new RegExp(`^\\s*(\\d+(?:[.,]\\d+)?)\\s+${unit.pattern.source}\\s+(.+?)$`, "i");
    const m = itemString.match(re);
    if (m) {
      const count = parseFloat(m[1].replace(",", "."));
      const namePart = m[2].replace(/\s*\(.*?\)/g, "").trim();
      const food = findFoodByName(namePart, foods);
      if (food) {
        const grams = Math.round(count * unit.grams);
        return { food, quantity: `${grams}g` };
      }
    }
  }

  // Nível 3: "X [food]" usando unit_weight_g do food
  // Captura "1 ovo cozido", "2 bananas", "1 manga espada madura"
  const countMatch = itemString.match(/^\s*(\d+(?:[.,]\d+)?)\s+([a-zA-ZÀ-ÿ].+?)$/);
  if (countMatch) {
    const count = parseFloat(countMatch[1].replace(",", "."));
    const namePart = countMatch[2].replace(/\s*\(.*?\)/g, "").trim();
    const food = findFoodByName(namePart, foods);
    if (food && food.unit_weight_g) {
      const grams = Math.round(count * food.unit_weight_g);
      return { food, quantity: `${grams}g` };
    }
  }

  return null;
}

/**
 * Soma kcal+macros de múltiplos items (uma refeição inteira ou o dia
 * inteiro). Items que não casarem com nenhum food da tabela são ignorados.
 *
 * Defensive: parseMealItem agora roda dentro de try/catch — qualquer
 * RegExp catastrofico ou item malformado vira "não-match" silencioso em
 * vez de crashar a arvore inteira.
 */
export function sumNutrition(
  items: string[],
  foods: Food[],
): { kcal: number; protein_g: number; carb_g: number; fat_g: number; matched: number; total: number } {
  let kcal = 0;
  let protein_g = 0;
  let carb_g = 0;
  let fat_g = 0;
  let matched = 0;
  for (const it of items) {
    if (typeof it !== "string") continue;
    let parsed: { food: Food; quantity: string } | null = null;
    try {
      parsed = parseMealItem(it, foods);
    } catch (err) {
      console.warn("[foods] parseMealItem failed for item:", it, err);
      continue;
    }
    if (!parsed) continue;
    let nut: { kcal: number; protein_g: number; carb_g: number; fat_g: number } | null = null;
    try {
      nut = nutritionForQuantity(parsed.food, parsed.quantity);
    } catch (err) {
      console.warn("[foods] nutritionForQuantity failed:", parsed, err);
      continue;
    }
    if (!nut) continue;
    if (
      !Number.isFinite(nut.kcal) ||
      !Number.isFinite(nut.protein_g) ||
      !Number.isFinite(nut.carb_g) ||
      !Number.isFinite(nut.fat_g)
    ) {
      console.warn("[foods] non-finite nutrition skipped:", parsed, nut);
      continue;
    }
    kcal += nut.kcal;
    protein_g += nut.protein_g;
    carb_g += nut.carb_g;
    fat_g += nut.fat_g;
    matched++;
  }
  return {
    kcal: Math.round(kcal),
    protein_g: +protein_g.toFixed(1),
    carb_g: +carb_g.toFixed(1),
    fat_g: +fat_g.toFixed(1),
    matched,
    total: items.length,
  };
}
