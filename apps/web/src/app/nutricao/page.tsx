import { createClient } from "@/lib/supabase/server";
import { getSubscriptionInfo } from "@/lib/supabase/guards";
import { Header } from "@/components/header";
import { NutricaoView } from "./nutricao-view";

export const dynamic = "force-dynamic";

type Month = { id: number; short_name: string; name: string; season: string };
type MealRow = {
  month_id: number;
  week_index: number;
  day_index: number;
  slot_key: string;
  data: {
    t: string;
    ico: string;
    time: string;
    items: string[];
    ptl: string;
    ptj: string;
    rec: string | null;
  };
};

const REGIONS_WITH_DATA = new Set(["nordeste", "sudeste", "norte", "sul", "centro_oeste"]);
const FALLBACK_REGION = "nordeste";

export default async function NutricaoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userRegion: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("region")
      .eq("id", user.id)
      .maybeSingle();
    userRegion = (profile?.region as string | null) ?? null;
  }

  // Se o user tem region populada e temos cardapio para ela, usa. Senao, fallback.
  const effectiveRegion = userRegion && REGIONS_WITH_DATA.has(userRegion) ? userRegion : FALLBACK_REGION;
  const hasRegion = !!userRegion;
  const regionSupported = !userRegion || REGIONS_WITH_DATA.has(userRegion);

  // plan_meals tem 12 meses × 4 sem × 7 dias × 7 slots = 2352 rows por regiao.
  // O PostgREST da Supabase tem db-max-rows=1000 (cap de servidor) que ignora
  // .limit() do cliente. Por isso quebramos em 3 batches de 4 meses (784 rows
  // cada, bem sob o cap) e concatenamos. Queries rodam em paralelo.
  const mealsBatches: number[][] = [
    [0, 1, 2, 3],
    [4, 5, 6, 7],
    [8, 9, 10, 11],
  ];
  const [monthsRes, ...mealsRes] = await Promise.all([
    supabase.from("months").select("id, short_name, name, season").order("id"),
    ...mealsBatches.map((ids) =>
      supabase
        .from("plan_meals")
        .select("month_id, week_index, day_index, slot_key, data")
        .eq("region", effectiveRegion)
        .in("month_id", ids)
        .order("month_id")
        .order("week_index")
        .order("day_index"),
    ),
  ]);
  const months = monthsRes.data;
  const meals = mealsRes.flatMap((r) => r.data ?? []);

  return (
    <div className="flex min-h-screen flex-col bg-[color:var(--bg)]">
      <Header user={user ? { email: user.email ?? "" } : null} />
      <NutricaoView
        months={(months ?? []) as Month[]}
        meals={(meals ?? []) as MealRow[]}
        subInfo={await getSubscriptionInfo()}
        userRegion={userRegion}
        effectiveRegion={effectiveRegion}
        hasRegion={hasRegion}
        regionSupported={regionSupported}
      />
    </div>
  );
}
