import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";
import { NavTabs } from "@/components/nav-tabs";
import { AchievementCard } from "./achievement-card";

export const dynamic = "force-dynamic";

type Achievement = {
  id: number;
  slug: string;
  title: string;
  description: string;
  emoji: string;
  category: string;
  threshold: number;
  sort_order: number;
};

type UserAchievement = {
  achievement_id: number;
  unlocked_at: string;
};

const CATEGORY_LABELS: Record<string, string> = {
  streak: "Consistência",
  xp: "Experiência",
  workout: "Treinos",
  exercise: "Exercícios",
  special: "Especiais",
};

export default async function ConquistasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: achievements } = await supabase
    .from("achievements")
    .select("*")
    .order("sort_order");

  let unlockedMap = new Map<number, string>();
  if (user) {
    const { data: userAchievements } = await supabase
      .from("user_achievements")
      .select("achievement_id, unlocked_at")
      .eq("user_id", user.id);

    for (const ua of (userAchievements ?? []) as UserAchievement[]) {
      unlockedMap.set(ua.achievement_id, ua.unlocked_at);
    }
  }

  const allAchievements = (achievements ?? []) as Achievement[];
  const totalUnlocked = unlockedMap.size;
  const totalAchievements = allAchievements.length;

  const categories = [...new Set(allAchievements.map(a => a.category))];

  return (
    <div className="flex min-h-screen flex-col bg-[color:var(--bg)]">
      <Header user={user ? { email: user.email ?? "" } : null} />

      <NavTabs />

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">
        <div className="mb-6 text-center">
          <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-wider">
            CONQUISTAS
          </h1>
          <div className="mt-2 flex items-center justify-center gap-2">
            <div className="h-2 flex-1 max-w-[200px] rounded-full bg-[color:var(--s2)]">
              <div
                className="h-2 rounded-full bg-[color:var(--or)] transition-all"
                style={{ width: `${totalAchievements > 0 ? (totalUnlocked / totalAchievements) * 100 : 0}%` }}
              />
            </div>
            <span className="font-[family-name:var(--font-condensed)] text-sm font-bold tracking-wider text-[color:var(--tx2)]">
              {totalUnlocked}/{totalAchievements}
            </span>
          </div>
        </div>

        {!user && (
          <div className="mb-6 rounded-lg border border-[color:var(--or)]/30 bg-[color:var(--ord)] p-4 text-center text-sm text-[color:var(--or)]">
            <Link href="/login" className="underline">Faça login</Link> para desbloquear conquistas treinando!
          </div>
        )}

        {categories.map(cat => {
          const catAchievements = allAchievements.filter(a => a.category === cat);
          return (
            <div key={cat} className="mb-6">
              <h2 className="slbl mb-3">{CATEGORY_LABELS[cat] ?? cat}</h2>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {catAchievements.map(a => (
                  <AchievementCard
                    key={a.id}
                    emoji={a.emoji}
                    title={a.title}
                    description={a.description}
                    unlocked={unlockedMap.has(a.id)}
                    unlockedAt={unlockedMap.get(a.id)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </main>
    </div>
  );
}
