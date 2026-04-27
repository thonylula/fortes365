/**
 * Cliente de busca da Open Food Facts API v2.
 *
 * Open Food Facts (https://world.openfoodfacts.org) é uma base aberta e
 * colaborativa de produtos alimentícios — ~3.5 milhões de items, dados
 * de rótulo de embalagens reais (incluindo marcas brasileiras de mercado),
 * sob licença ODbL.
 *
 * Uso aqui: fallback runtime quando o item da refeição não casa com
 * forte_foods. Resultado é cacheado em forte_foods (auto-grow), evitando
 * repetir chamada no próximo render.
 *
 * - Sem auth necessária
 * - Rate limit conservador (10 buscas/min por IP) — nosso cache de DB
 *   evita repetição
 * - Identificação via User-Agent (boa prática OFF)
 *
 * Docs: https://openfoodfacts.github.io/openfoodfacts-server/api/
 */

import type { Food, FoodCategory } from "./foods";

const OFF_BASE = "https://world.openfoodfacts.org/api/v2";
const USER_AGENT = "FORTE365/1.0 (https://fortes365.vercel.app)";
const REQUEST_TIMEOUT_MS = 2500;

type OffNutriments = {
  "energy-kcal_100g"?: number;
  "energy-kcal_value"?: number;
  proteins_100g?: number;
  carbohydrates_100g?: number;
  fat_100g?: number;
  fiber_100g?: number;
  serving_quantity?: number; // gramas por porção, quando declarado
};

type OffProduct = {
  code?: string;
  product_name?: string;
  product_name_pt?: string;
  brands?: string;
  categories_tags?: string[];
  nutriments?: OffNutriments;
  serving_size?: string;
};

type OffSearchResponse = {
  count?: number;
  page?: number;
  page_size?: number;
  products?: OffProduct[];
};

/**
 * Mapeia categorias da OFF (categories_tags) pra nossas FoodCategory.
 * Heuristica baseada em palavras-chave nos slugs OFF (ex: "en:meats").
 */
function inferCategoryFromOff(product: OffProduct): FoodCategory {
  const tags = (product.categories_tags ?? []).join(" ").toLowerCase();
  if (/\b(meat|poultry|fish|seafood|legumes?|tofu|carnes|aves|peixes)\b/.test(tags)) return "protein";
  if (/\b(dairy|cheese|milk|yogurt|leite|laticinios|queijo)\b/.test(tags)) return "dairy";
  if (/\b(oils?|fats?|nuts?|seeds?|oleos|azeites|castanhas|sementes)\b/.test(tags)) return "fat";
  if (/\b(fruits?|frutas)\b/.test(tags)) return "fruit";
  if (/\b(vegetables?|legumes|verduras|hortali[cç]as)\b/.test(tags)) return "vegetable";
  if (/\b(cereals?|pasta|breads?|rice|cereais|paes|massas|arroz)\b/.test(tags)) return "carb";
  // Olhar pro perfil de macros: maior densidade decide
  const n = product.nutriments;
  if (n) {
    const p = n.proteins_100g ?? 0;
    const c = n.carbohydrates_100g ?? 0;
    const f = n.fat_100g ?? 0;
    if (p >= 15 && p > c && p > f) return "protein";
    if (f >= 20) return "fat";
    if (c >= 30) return "carb";
  }
  return "other";
}

/**
 * Cria um slug seguro pra forte_foods a partir do código OFF.
 * Prefixo "off_" evita colisão com nossos slugs canônicos.
 */
function offSlug(code: string | undefined, fallbackName: string): string {
  if (code && /^[\d]{8,14}$/.test(code)) return `off_${code}`;
  // Fallback: hash determinístico do nome (estável entre chamadas)
  const normalized = fallbackName
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^\w]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
  return `off_${normalized}`;
}

/**
 * Valida que um produto OFF tem dados nutricionais completos o bastante
 * pra ser útil. Sem kcal ou sem proteína, descarta.
 */
function hasUsableNutrition(p: OffProduct): boolean {
  const n = p.nutriments;
  if (!n) return false;
  const kcal = n["energy-kcal_100g"] ?? n["energy-kcal_value"];
  if (kcal == null || kcal < 0 || kcal > 1000) return false;
  if (n.proteins_100g == null || n.carbohydrates_100g == null || n.fat_100g == null) return false;
  return true;
}

/**
 * Sanity check: o produto OFF tem nome que sugere relação com o query?
 * Evita false positives (ex: query "frango" retornando "Sopa Knorr" só
 * porque tem "frango" em algum tag obscuro).
 */
function isPlausibleMatch(query: string, product: OffProduct): boolean {
  const name = (product.product_name_pt ?? product.product_name ?? "").toLowerCase();
  if (!name) return false;
  const queryNorm = query
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .split(/\s+/)
    .filter((w) => w.length >= 4);
  if (queryNorm.length === 0) return true; // query muito curta, deixa passar
  const nameNorm = name.normalize("NFD").replace(/\p{Diacritic}/gu, "");
  // Pelo menos uma palavra significativa do query precisa aparecer no nome
  return queryNorm.some((w) => nameNorm.includes(w));
}

/**
 * Busca um alimento na OFF pelo nome em texto livre. Retorna o melhor
 * candidato (primeiro resultado plausível com nutrição completa) já no
 * formato Food do nosso schema, ou null se nada útil.
 *
 * Aborta após REQUEST_TIMEOUT_MS pra não atrasar render do /nutricao.
 */
export async function searchOpenFoodFacts(query: string): Promise<Food | null> {
  if (!query || query.trim().length < 3) return null;

  const url = `${OFF_BASE}/search?` + new URLSearchParams({
    search_terms: query,
    page_size: "5",
    fields: "code,product_name,product_name_pt,brands,categories_tags,nutriments,serving_size",
    sort_by: "popularity_key",
    countries_tags_en: "brazil",
  }).toString();

  let res: Response;
  try {
    res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      // Cache de 1h no edge — items pesquisados não mudam frequentemente
      next: { revalidate: 3600 },
    });
  } catch (err) {
    console.warn("[openfoodfacts] fetch failed:", query, err);
    return null;
  }

  if (!res.ok) return null;

  let data: OffSearchResponse;
  try {
    data = (await res.json()) as OffSearchResponse;
  } catch {
    return null;
  }

  const products = data.products ?? [];
  const candidate = products.find((p) => hasUsableNutrition(p) && isPlausibleMatch(query, p));
  if (!candidate) return null;

  const n = candidate.nutriments!;
  const kcal = n["energy-kcal_100g"] ?? n["energy-kcal_value"] ?? 0;
  const name = candidate.product_name_pt ?? candidate.product_name ?? query;

  return {
    slug: offSlug(candidate.code, name),
    name: name.slice(0, 200),
    category: inferCategoryFromOff(candidate),
    kcal_per_100g: Math.round(kcal * 10) / 10,
    protein_g: Math.round((n.proteins_100g ?? 0) * 10) / 10,
    carb_g: Math.round((n.carbohydrates_100g ?? 0) * 10) / 10,
    fat_g: Math.round((n.fat_100g ?? 0) * 10) / 10,
    fiber_g: n.fiber_100g != null ? Math.round(n.fiber_100g * 10) / 10 : null,
    state: null,
    source: "Open Food Facts",
    note: candidate.brands ?? null,
    unit_weight_g: n.serving_quantity ?? null,
  };
}
