import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSubscriptionInfo } from "@/lib/supabase/guards";
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

  const [{ data: items }, { data: months }] = await Promise.all([
    supabase.from("shopping_items").select("scope, month_id, category, name, amount, raw"),
    supabase.from("months").select("id, short_name, name").order("id"),
  ]);

  return (
    <div className="flex min-h-screen flex-col bg-[color:var(--bg)]">
      <header className="sticky top-0 z-20 flex h-[52px] items-center justify-between border-b border-[color:var(--bd)] bg-[color:var(--s1)] px-4">
        <Link href="/" className="logo">FORT<span>E</span><sub>365</sub></Link>
        <Link
          href={user ? "/conta" : "/login"}
          className="rounded-md border border-[color:var(--or)] bg-[color:var(--ord)] px-3 py-1.5 font-[family-name:var(--font-condensed)] text-[11px] font-bold uppercase tracking-wider text-[color:var(--or)]"
        >
          {user ? "Conta" : "Entrar"}
        </Link>
      </header>
      <ComprasView items={(items ?? []) as ShopItem[]} months={(months ?? []) as Month[]} subInfo={await getSubscriptionInfo()} />
    </div>
  );
}
