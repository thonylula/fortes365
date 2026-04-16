import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ReceitasView } from "./receitas-view";

export const dynamic = "force-dynamic";

type Recipe = {
  slug: string;
  title: string;
  icon: string | null;
  category: string | null;
  time_label: string | null;
  description: string | null;
  data: {
    ings?: { n: string; a: string }[];
    steps?: string[];
    tip?: string;
    porcao?: { l: string; j: string };
  };
};

export default async function ReceitasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: recipes } = await supabase
    .from("recipes")
    .select("slug, title, icon, category, time_label, description, data")
    .order("title");

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
      <ReceitasView recipes={(recipes ?? []) as Recipe[]} />
    </div>
  );
}
