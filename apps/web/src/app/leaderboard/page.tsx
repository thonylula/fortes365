import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";
import { NavTabs } from "@/components/nav-tabs";
import { LeaderboardView } from "./leaderboard-view";

export const dynamic = "force-dynamic";

export type LeaderboardEntry = {
  user_id: string;
  display_name: string;
  region: string | null;
  fitness_level: number | null;
  total_xp: number;
  current_streak: number;
  longest_streak: number;
  workout_count: number;
  achievement_count: number;
  skill_count: number;
  rank: number;
};

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let entries: LeaderboardEntry[] = [];
  let myRank: number | null = null;

  try {
    const { data } = await supabase.rpc("get_leaderboard", {
      metric: "xp",
      region_filter: null,
      page_size: 50,
      page_offset: 0,
    });
    entries = (data ?? []) as LeaderboardEntry[];

    if (user) {
      const { data: rankData } = await supabase.rpc("get_my_rank", { metric: "xp" });
      myRank = rankData as number | null;
    }
  } catch {
    // RPC not available yet
  }

  const userInfo = user ? { email: user.email ?? "" } : null;

  return (
    <div className="flex min-h-screen flex-col bg-[color:var(--bg)]">
      <Header user={userInfo} />
      <NavTabs />
      <LeaderboardView
        initialEntries={entries}
        currentUserId={user?.id ?? null}
        initialMyRank={myRank}
      />
    </div>
  );
}
