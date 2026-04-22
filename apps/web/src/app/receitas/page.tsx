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
  cached_video_id: string | null;
  data: {
    ings?: { n: string; a: string }[];
    steps?: string[];
    tip?: string;
    porcao?: { l: string; j: string };
  };
};

const REGIONS_WITH_DATA = new Set(["nordeste", "sudeste", "norte", "sul", "centro_oeste"]);
const FALLBACK_REGION = "nordeste";

export default async function ReceitasPage() {
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

  const effectiveRegion =
    userRegion && REGIONS_WITH_DATA.has(userRegion) ? userRegion : FALLBACK_REGION;
  const hasRegion = !!userRegion;
  const regionSupported = !userRegion || REGIONS_WITH_DATA.has(userRegion);

  const { data: recipes } = await supabase
    .from("recipes")
    .select(
      "slug, title, icon, category, time_label, description, cached_video_id, data",
    )
    .eq("region", effectiveRegion)
    .order("title");

  return (
    <div className="flex min-h-screen flex-col bg-[color:var(--bg)]">
      <Header user={user ? { email: user.email ?? "" } : null} />
      <ReceitasView
        recipes={(recipes ?? []) as Recipe[]}
        userRegion={userRegion}
        effectiveRegion={effectiveRegion}
        hasRegion={hasRegion}
        regionSupported={regionSupported}
      />
    </div>
  );
}
