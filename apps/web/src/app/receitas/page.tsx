import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";
import { calculateMacros, metricsFromProfile } from "@/lib/macros";
import { sumNutrition, type Food } from "@/lib/foods";
import { enrichFoodsFromOpenFoodFacts } from "@/lib/foods-cache";
import type { RecipeNutrition } from "@/lib/recipes";
import { ReceitasView } from "./receitas-view";

export const dynamic = "force-dynamic";

type Recipe = {
  slug: string;
  title: string;
  icon: string | null;
  category: string | null;
  time_label: string | null;
  description: string | null;
  cached_video_id: string | null;
  state: string | null;
  data: {
    ings?: { n: string; a: string }[];
    steps?: string[];
    tip?: string;
  };
};

export type RecipeWithNutrition = Recipe & { nutrition: RecipeNutrition };

const REGIONS_WITH_DATA = new Set(["nordeste", "sudeste", "norte", "sul", "centro_oeste"]);
const FALLBACK_REGION = "nordeste";

export default async function ReceitasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userRegion: string | null = null;
  let userMetrics: ReturnType<typeof metricsFromProfile> = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select(
        "region, weight_kg, height_cm, sex, birth_date, activity_level, goal",
      )
      .eq("id", user.id)
      .maybeSingle();
    userRegion = (profile?.region as string | null) ?? null;
    userMetrics = profile ? metricsFromProfile(profile) : null;
  }

  const effectiveRegion =
    userRegion && REGIONS_WITH_DATA.has(userRegion) ? userRegion : FALLBACK_REGION;
  const hasRegion = !!userRegion;
  const regionSupported = !userRegion || REGIONS_WITH_DATA.has(userRegion);

  const [recipesRes, foodsRes] = await Promise.all([
    supabase
      .from("recipes")
      .select(
        "slug, title, icon, category, time_label, description, cached_video_id, state, data",
      )
      .eq("region", effectiveRegion)
      .order("title"),
    supabase
      .from("forte_foods")
      .select(
        "slug, name, category, kcal_per_100g, protein_g, carb_g, fat_g, fiber_g, state, source, note, unit_weight_g, default_serving_g",
      ),
  ]);
  const recipes = (recipesRes.data ?? []) as Recipe[];
  let foods = (foodsRes.data ?? []) as Food[];

  // Auto-cache via Open Food Facts: pra ingredientes de receita que ainda
  // não estão em forte_foods, busca na OFF (3.5M produtos) e salva. Banco
  // cresce gradualmente conforme receitas são abertas. Cap interno de 6
  // lookups por render mantém render rápido e dentro do rate limit.
  try {
    const allIngredients = recipes.flatMap((r) =>
      (r.data?.ings ?? []).map((i) => `${i.a} ${i.n}`),
    );
    foods = await enrichFoodsFromOpenFoodFacts(allIngredients, foods);
  } catch (err) {
    console.warn("[receitas] OFF enrich failed, continuando com banco local:", err);
  }

  // Deriva nutrição de cada receita a partir dos ingredientes do data.ings
  const recipesWithNutrition: RecipeWithNutrition[] = recipes.map((r) => {
    const ings = r.data?.ings ?? [];
    const items = ings.map((i) => `${i.a} ${i.n}`);
    const sum = sumNutrition(items, foods);
    return {
      ...r,
      nutrition: {
        kcal: sum.kcal,
        protein_g: sum.protein_g,
        carb_g: sum.carb_g,
        fat_g: sum.fat_g,
        matched: sum.matched,
        total: sum.total,
      },
    };
  });

  const dailyTarget = userMetrics ? calculateMacros(userMetrics) : null;

  return (
    <div className="flex min-h-screen flex-col bg-[color:var(--bg)]">
      <Header user={user ? { email: user.email ?? "" } : null} />
      <ReceitasView
        recipes={recipesWithNutrition}
        userRegion={userRegion}
        effectiveRegion={effectiveRegion}
        hasRegion={hasRegion}
        regionSupported={regionSupported}
        userMetrics={userMetrics}
        dailyTarget={dailyTarget}
      />
    </div>
  );
}
