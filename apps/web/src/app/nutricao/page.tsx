import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSubscriptionInfo } from "@/lib/supabase/guards";
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
      <header className="sticky top-0 z-20 flex h-[52px] items-center justify-between border-b border-[color:var(--bd)] bg-[color:var(--s1)] px-4">
        <Link href="/" className="logo">FORT<span>E</span><sub>365</sub></Link>
        {user ? (
          <Link href="/conta" className="rounded-md border border-[color:var(--or)] bg-[color:var(--ord)] px-3 py-1.5 font-[family-name:var(--font-condensed)] text-[11px] font-bold uppercase tracking-wider text-[color:var(--or)]">
            Conta
          </Link>
        ) : (
          <Link href="/login" className="rounded-md border border-[color:var(--or)] bg-[color:var(--ord)] px-3 py-1.5 font-[family-name:var(--font-condensed)] text-[11px] font-bold uppercase tracking-wider text-[color:var(--or)]">
            Entrar
          </Link>
        )}
      </header>
      <NutricaoView months={(months ?? []) as Month[]} meals={(meals ?? []) as MealRow[]} subInfo={await getSubscriptionInfo()} />
    </div>
  );
}
