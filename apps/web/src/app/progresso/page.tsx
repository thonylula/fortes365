import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Header } from "@/components/header";
import { NavTabs } from "@/components/nav-tabs";
import { ProgressView } from "./progress-view";

export const dynamic = "force-dynamic";

export default async function ProgressoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/progresso");

  const [{ data: progress }, { data: profile }, { data: workouts }, { data: achievements }] =
    await Promise.all([
      supabase
        .from("user_progress")
        .select("total_xp, current_streak, longest_streak, last_workout_at, current_month, current_week")
        .eq("user_id", user.id)
        .single(),
      supabase
        .from("profiles")
        .select("display_name, fitness_level, weight_kg, height_cm, created_at")
        .eq("id", user.id)
        .single(),
      supabase
        .from("workout_sessions")
        .select("id, started_at, finished_at, rating, mood")
        .eq("user_id", user.id)
        .order("started_at", { ascending: false })
        .limit(90),
      supabase
        .from("user_achievements")
        .select("achievement_id, unlocked_at")
        .eq("user_id", user.id),
    ]);

  let skillStats = { total: 0, mastered: 0 };
  try {
    const [{ count: totalSkills }, { count: masteredSkills }] = await Promise.all([
      supabase.from("skill_nodes").select("*", { count: "exact", head: true }),
      supabase.from("user_skills").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "mastered"),
    ]);
    skillStats = { total: totalSkills ?? 0, mastered: masteredSkills ?? 0 };
  } catch { /* skill tables may not exist */ }

  let dailyHealth: HealthRow[] = [];
  try {
    const since = new Date();
    since.setDate(since.getDate() - 13);
    const sinceIso = since.toISOString().slice(0, 10);
    const { data: health } = await supabase
      .from("daily_health_metrics")
      .select("date, steps, active_kcal, resting_hr")
      .eq("user_id", user.id)
      .gte("date", sinceIso)
      .order("date", { ascending: true });
    dailyHealth = (health ?? []) as HealthRow[];
  } catch { /* health tables may not exist */ }

  const userInfo = { email: user.email ?? "", name: user.user_metadata?.display_name as string | undefined };

  return (
    <div className="flex min-h-screen flex-col bg-[color:var(--bg)]">
      <Header user={userInfo} />
      <NavTabs />
      <ProgressView
        progress={progress}
        profile={profile}
        workouts={(workouts ?? []) as WorkoutRow[]}
        achievementCount={(achievements ?? []).length}
        skillStats={skillStats}
        memberSince={profile?.created_at ?? user.created_at}
        dailyHealth={dailyHealth}
      />
    </div>
  );
}

export type WorkoutRow = {
  id: string;
  started_at: string;
  finished_at: string | null;
  rating: number | null;
  mood: string | null;
};

export type HealthRow = {
  date: string;
  steps: number | null;
  active_kcal: number | null;
  resting_hr: number | null;
};
