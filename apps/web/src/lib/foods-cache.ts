/**
 * Auto-cache de alimentos via Open Food Facts.
 *
 * Quando uma refeição tem item que não casa com nenhum food em
 * forte_foods (TACO/USDA/Embrapa/TBCA-USP local), busca na OFF e salva
 * o resultado pra próxima. App fica mais inteligente conforme é usado.
 *
 * Roda server-side (no /nutricao/page.tsx). Usa service role pra escrever
 * em forte_foods (RLS bloqueia INSERT pra anon/auth normal).
 */

import { createClient as createAdminClient } from "@supabase/supabase-js";
import {
  findFoodByName,
  parseMealItem,
  type Food,
} from "./foods";
import { searchOpenFoodFacts } from "./openfoodfacts";

const MAX_OFF_LOOKUPS_PER_REQUEST = 6;

/**
 * Extrai o nome candidato a alimento de um item de refeição. Remove
 * quantidade explícita ("60g", "200ml"), parênteses, e palavras-stop
 * curtas. Devolve só o "core" pra busca na OFF.
 */
function extractFoodName(itemString: string): string {
  return itemString
    .replace(/\(.*?\)/g, " ")
    .replace(/\b\d+(?:[.,]\d+)?\s*(?:kg|g|ml|l|col\s*(?:sopa|cha|ch|cafe)|fatias?|torradas?|scoops?|copos?|bowls?|tigelas?|x[ií]caras?|punhados?|conchas?|postas?|unidades?|ovos?)\b/gi, " ")
    .replace(/[,;:].+$/, "") // ignora descritor após vírgula/ponto-vírgula/dois-pontos
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Para cada item da lista que não casa com nenhum food existente, tenta
 * resolver via Open Food Facts. Resultados válidos são inseridos em
 * forte_foods (com source='Open Food Facts') e adicionados ao array.
 *
 * Limita a MAX_OFF_LOOKUPS_PER_REQUEST chamadas por render pra:
 * - Não estourar rate limit da OFF (10/min por IP)
 * - Não atrasar o /nutricao mais que ~3s no pior caso (paralelo)
 *
 * Items com 1-2 caracteres ou só genéricos ("salada", "fruta") são
 * pulados — deixar pro matcher local resolver via fruta_generica etc.
 */
export async function enrichFoodsFromOpenFoodFacts(
  items: string[],
  existingFoods: Food[],
): Promise<Food[]> {
  // Identifica items que não casam localmente
  const unmatchedQueries = new Set<string>();
  for (const item of items) {
    if (typeof item !== "string") continue;
    let parsed: ReturnType<typeof parseMealItem> = null;
    try {
      parsed = parseMealItem(item, existingFoods);
    } catch {
      // ignore — defensive (já há try/catch em sumNutrition)
    }
    if (parsed) continue;
    // Tem nome reconhecível mas sem qty? Tenta findFoodByName direto
    const name = extractFoodName(item);
    if (!name || name.length < 4) continue;
    if (findFoodByName(name, existingFoods)) continue;
    unmatchedQueries.add(name.toLowerCase());
  }

  const queries = Array.from(unmatchedQueries).slice(0, MAX_OFF_LOOKUPS_PER_REQUEST);
  if (queries.length === 0) return existingFoods;

  // Busca paralela na OFF
  const results = await Promise.allSettled(queries.map((q) => searchOpenFoodFacts(q)));
  const newFoods: Food[] = [];
  const seenSlugs = new Set(existingFoods.map((f) => f.slug));

  for (const r of results) {
    if (r.status !== "fulfilled" || !r.value) continue;
    if (seenSlugs.has(r.value.slug)) continue;
    seenSlugs.add(r.value.slug);
    newFoods.push(r.value);
  }

  if (newFoods.length === 0) return existingFoods;

  // Persiste com service role (RLS bloqueia anon/auth INSERT em forte_foods)
  const serviceUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (serviceUrl && serviceKey) {
    try {
      const admin = createAdminClient(serviceUrl, serviceKey);
      const { error } = await admin
        .from("forte_foods")
        .upsert(newFoods, { onConflict: "slug", ignoreDuplicates: true });
      if (error) {
        console.warn("[foods-cache] upsert failed:", error.message);
      }
    } catch (err) {
      console.warn("[foods-cache] admin client failed:", err);
    }
  }

  return [...existingFoods, ...newFoods];
}
