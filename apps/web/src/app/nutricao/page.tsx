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

const REGIONS_WITH_DATA = new Set(["nordeste"]);
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
      .eq("user_id", user.id)
      .maybeSingle();
    userRegion = (profile?.region as string | null) ?? null;
  }

  // Se o user tem region populada e temos cardapio para ela, usa. Senao, fallback.
  const effectiveRegion = userRegion && REGIONS_WITH_DATA.has(userRegion) ? userRegion : FALLBACK_REGION;
  const hasRegion = !!userRegion;
  const regionSupported = !userRegion || REGIONS_WITH_DATA.has(userRegion);

  const [{ data: months }, { data: meals }] = await Promise.all([
    supabase.from("months").select("id, short_name, name, season").order("id"),
    supabase
      .from("plan_meals")
      .select("month_id, week_index, day_index, slot_key, data")
      .eq("region", effectiveRegion)
      .order("month_id")
      .order("week_index")
      .order("day_index"),
  ]);

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
