import { createClient } from "@/lib/supabase/server";
import { getSubscriptionInfo } from "@/lib/supabase/guards";
import { Header } from "@/components/header";
import { metricsFromProfile } from "@/lib/macros";
import { ComprasView } from "./compras-view";

export const dynamic = "force-dynamic";

type ShopItem = {
  scope: string;
  month_id: number | null;
  category: string | null;
  name: string;
  amount: string | null;
  raw: { ql?: string; qj?: string; obs?: string } | null;
};

type Month = { id: number; short_name: string; name: string };

export default async function ComprasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: items }, { data: months }, profileRes] = await Promise.all([
    supabase.from("shopping_items").select("scope, month_id, category, name, amount, raw"),
    supabase.from("months").select("id, short_name, name").order("id"),
    user
      ? supabase
          .from("profiles")
          .select(
            "display_name, weight_kg, height_cm, sex, birth_date, activity_level, goal",
          )
          .eq("id", user.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const profile = profileRes.data as {
    display_name?: string | null;
    weight_kg?: number | null;
    height_cm?: number | null;
    sex?: string | null;
    birth_date?: string | null;
    activity_level?: string | null;
    goal?: string | null;
  } | null;
  const userInitial = (
    profile?.display_name?.trim().charAt(0) ??
    user?.email?.trim().charAt(0) ??
    ""
  ).toUpperCase() || null;
  const userMetrics = profile ? metricsFromProfile(profile) : null;

  return (
    <div className="flex min-h-screen flex-col bg-[color:var(--bg)]">
      <Header user={user ? { email: user.email ?? "" } : null} />
      <ComprasView
        items={(items ?? []) as ShopItem[]}
        months={(months ?? []) as Month[]}
        subInfo={await getSubscriptionInfo()}
        userInitial={userInitial}
        userMetrics={userMetrics}
      />
    </div>
  );
}
