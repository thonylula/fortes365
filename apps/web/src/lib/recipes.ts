/**
 * Helpers pra classificar receitas em relação ao perfil científico do user.
 * Roda só sobre o resultado de `sumNutrition` (em foods.ts) — não faz query
 * nem precisa do banco aqui, fica testável puro.
 */

import type { Macros, UserMetrics } from "./macros";

export type RecipeNutrition = {
  kcal: number;
  protein_g: number;
  carb_g: number;
  fat_g: number;
  matched: number;
  total: number;
};

export type RecipeTag = "low_kcal" | "hiperproteica" | "pos_treino" | "low_carb" | "alta_kcal";

export type FilterKey = "all" | "for_you" | "hiperproteica" | "low_kcal" | "pos_treino" | "low_carb";

export const FILTER_LABEL: Record<FilterKey, string> = {
  all: "Tudo",
  for_you: "Pra você ★",
  hiperproteica: "Hiperproteicas",
  low_kcal: "Low-cal",
  pos_treino: "Pós-treino",
  low_carb: "Low-carb",
};

/**
 * Cobertura mínima de ingredientes pra confiar no cálculo. Se menos de 70%
 * dos ingredientes deram match em forte_foods, a estimativa é parcial — não
 * marcamos tag nem aplicamos score.
 */
const MIN_COVERAGE = 0.7;

export function hasReliableNutrition(n: RecipeNutrition): boolean {
  if (n.total === 0) return false;
  return n.matched / n.total >= MIN_COVERAGE;
}

/**
 * Tags absolutas baseadas só na nutrição da receita. Independem do perfil.
 *
 * - low_kcal: ≤450 kcal por porção (uma refeição leve)
 * - hiperproteica: ≥0.075 g proteína por kcal (≥30g P por 400 kcal)
 * - pos_treino: alto carb (≥50g) + proteína decente (≥20g)
 * - low_carb: ≤30g carb por porção
 * - alta_kcal: ≥700 kcal (refeição densa, boa pra bulking)
 */
export function recipeTags(n: RecipeNutrition): RecipeTag[] {
  if (!hasReliableNutrition(n)) return [];
  const tags: RecipeTag[] = [];
  if (n.kcal > 0 && n.kcal <= 450) tags.push("low_kcal");
  if (n.kcal > 0 && n.protein_g / n.kcal >= 0.075) tags.push("hiperproteica");
  if (n.carb_g >= 50 && n.protein_g >= 20) tags.push("pos_treino");
  if (n.carb_g <= 30 && n.kcal > 0) tags.push("low_carb");
  if (n.kcal >= 700) tags.push("alta_kcal");
  return tags;
}

/**
 * Score 0-100 indicando o quanto a receita "encaixa" no objetivo do user.
 * ≥70 = "★ pra você" (badge + sugestão).
 *
 * Sem perfil ou cobertura ruim → 0.
 *
 * Lógica por objetivo:
 * - cutting: priorizar low-kcal + alta densidade de proteína; penalizar
 *   refeições densas (alta_kcal) e gordas (>25g).
 * - maintenance: equilíbrio (kcal entre 350-650) + boa proteína.
 * - bulking: priorizar densidade calórica (alta_kcal) + carb pós-treino.
 */
export function fitScore(
  n: RecipeNutrition,
  metrics: UserMetrics | null,
  _target: Macros | null,
): number {
  if (!metrics) return 0;
  if (!hasReliableNutrition(n)) return 0;

  const tags = new Set(recipeTags(n));
  let score = 0;

  if (metrics.goal === "cutting") {
    if (tags.has("low_kcal")) score += 35;
    if (tags.has("hiperproteica")) score += 35;
    if (tags.has("low_carb")) score += 20;
    if (tags.has("alta_kcal")) score -= 25;
    if (n.fat_g > 25) score -= 15;
  } else if (metrics.goal === "bulking") {
    if (tags.has("alta_kcal")) score += 40;
    if (tags.has("pos_treino")) score += 30;
    if (tags.has("hiperproteica")) score += 20;
    if (n.carb_g >= 60) score += 15;
    if (tags.has("low_kcal")) score -= 15;
  } else {
    // maintenance
    if (n.kcal >= 350 && n.kcal <= 650) score += 35;
    if (tags.has("hiperproteica")) score += 25;
    if (tags.has("pos_treino")) score += 20;
    if (tags.has("alta_kcal")) score -= 10;
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Decide se uma receita aparece no grid filtrado. Para "for_you" depende
 * do score; para o resto basta a tag presente.
 */
export function recipeFitsFilter(
  tags: RecipeTag[],
  score: number,
  filter: FilterKey,
): boolean {
  if (filter === "all") return true;
  if (filter === "for_you") return score >= 70;
  return tags.includes(filter as RecipeTag);
}
