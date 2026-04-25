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
