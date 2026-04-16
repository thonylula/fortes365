import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "../login/actions";
import { RegionSelector } from "./region-selector";
import { AchievementSummary } from "./achievement-summary";

export default async function ContaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/conta");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, fitness_level, region, created_at")
    .eq("id", user.id)
    .single();

  const { data: progress } = await supabase
    .from("user_progress")
    .select("total_xp, current_streak, longest_streak, last_workout_at")
    .eq("user_id", user.id)
    .single();

  // Achievements tables may not exist if migration 0003 hasn't been applied
  let allAchievements: { id: number; title: string; emoji: string }[] | null = null;
  let userAchievements: { achievement_id: number; unlocked_at: string }[] | null = null;
  try {
    const [achRes, uaRes] = await Promise.all([
      supabase.from("achievements").select("id, title, emoji").order("sort_order"),
      supabase.from("user_achievements").select("achievement_id, unlocked_at").eq("user_id", user.id),
    ]);
    if (!achRes.error) allAchievements = achRes.data;
    if (!uaRes.error) userAchievements = uaRes.data;
  } catch {
    // Tables don't exist yet
  }

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("pt-BR", {
        month: "long",
        year: "numeric",
      })
    : "—";

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-[52px] items-center justify-between border-b border-[color:var(--bd)] bg-[color:var(--s1)] px-4">
        <Link href="/treino" className="logo">
          FORT<span>E</span>
          <sub>365</sub>
        </Link>
        <Link
          href="/treino"
          className="font-[family-name:var(--font-condensed)] text-[11px] font-bold uppercase tracking-[1.5px] text-[color:var(--or)]"
        >
          ← Treino
        </Link>
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 px-6 py-10">
        <h1 className="mb-6 font-[family-name:var(--font-display)] text-3xl tracking-wider">
          MINHA CONTA
        </h1>

        <div className="space-y-4">
          <div className="rounded-lg border border-[color:var(--bd)] bg-[color:var(--s1)] p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[color:var(--ord)] font-[family-name:var(--font-display)] text-xl text-[color:var(--or)]">
                {(profile?.display_name ?? user.email ?? "U").charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="text-lg font-bold">
                  {profile?.display_name ?? user.email?.split("@")[0]}
                </div>
                <div className="text-xs text-[color:var(--tx2)]">{user.email}</div>
                <div className="text-xs text-[color:var(--tx3)]">
                  Membro desde {memberSince}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="ks-box">
              <div className="ks-v">{progress?.total_xp ?? 0}</div>
              <div className="ks-l">XP Total</div>
            </div>
            <div className="ks-box">
              <div className="ks-v" style={{ color: "var(--or)" }}>
                {progress?.current_streak ?? 0}
              </div>
              <div className="ks-l">Streak</div>
            </div>
            <div className="ks-box">
              <div className="ks-v" style={{ color: "var(--gn)" }}>
                {progress?.longest_streak ?? 0}
              </div>
              <div className="ks-l">Recorde</div>
            </div>
          </div>

          <AchievementSummary
            total={allAchievements?.length ?? 0}
            unlocked={(userAchievements ?? []).map(ua => {
              const a = allAchievements?.find(a => a.id === ua.achievement_id);
              return a ? { emoji: a.emoji, title: a.title } : null;
            }).filter(Boolean) as { emoji: string; title: string }[]}
          />

          <RegionSelector currentRegion={profile?.region ?? null} />

          <div className="rounded-lg border border-[color:var(--bd)] bg-[color:var(--s1)] p-5">
            <div className="slbl mb-3">Assinatura</div>
            <div className="rounded-md bg-[color:var(--s2)] px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="font-[family-name:var(--font-condensed)] text-sm font-bold uppercase tracking-wider text-[color:var(--gn)]">
                  Grátis
                </span>
                <span className="text-xs text-[color:var(--tx3)]">
                  Meses 1 e 2 liberados
                </span>
              </div>
            </div>
            <p className="mt-3 text-xs text-[color:var(--tx3)]">
              Upgrade para Premium em breve — R$14,90/mês com 12 meses + coach IA.
            </p>
          </div>
        </div>

        <form action={logout} className="mt-8">
          <button
            type="submit"
            className="w-full rounded-md border border-[color:var(--bd)] bg-[color:var(--s2)] py-2.5 font-[family-name:var(--font-condensed)] text-sm font-bold uppercase tracking-wider text-[color:var(--tx2)] transition-colors hover:border-red-500/40 hover:text-red-400"
          >
            Sair da conta
          </button>
        </form>
      </main>
    </div>
  );
}
