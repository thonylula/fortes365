import { createClient } from "@/lib/supabase/server";
import { getSubscriptionInfo } from "@/lib/supabase/guards";
import { Header } from "@/components/header";
import { NutricaoView } from "./nutricao-view";

export const dynamic = "force-dynamic";

type Month = { id: number; short_name: string; name: string; season: string };
type MealRow = {
  month_id: number;
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

export default async function NutricaoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: months }, { data: meals }] = await Promise.all([
    supabase.from("months").select("id, short_name, name, season").order("id"),
    supabase.from("plan_meals").select("month_id, day_index, slot_key, data").order("month_id").order("day_index"),
  ]);

  return (
    <div className="flex min-h-screen flex-col bg-[color:var(--bg)]">
      <Header user={user ? { email: user.email ?? "" } : null} />
      <NutricaoView months={(months ?? []) as Month[]} meals={(meals ?? []) as MealRow[]} subInfo={await getSubscriptionInfo()} />
    </div>
  );
}
