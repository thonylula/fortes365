import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";
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
      <Header user={user ? { email: user.email ?? "" } : null} />
      <ReceitasView recipes={(recipes ?? []) as Recipe[]} />
    </div>
  );
}
