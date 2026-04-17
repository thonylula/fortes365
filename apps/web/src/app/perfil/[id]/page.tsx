import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";

export const dynamic = "force-dynamic";

const FITNESS_LABELS = ["Iniciante", "Basico", "Intermediario", "Avancado"];
const REGION_LABELS: Record<string, string> = {
  nordeste: "Nordeste",
  sudeste: "Sudeste",
  sul: "Sul",
  norte: "Norte",
  centro_oeste: "Centro-Oeste",
};

export default async function PerfilPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, region, fitness_level, created_at")
    .eq("id", id)
    .single();

  if (!profile) {
    return (
      <div className="flex min-h-screen flex-col bg-[color:var(--bg)]">
        <Header backLink={{ href: "/leaderboard", label: "← Ranking" }} />
        <main className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className="mb-3 text-4xl">👤</div>
            <h1 className="font-[family-name:var(--font-display)] text-xl tracking-wider">PERFIL NAO ENCONTRADO</h1>
          </div>
        </main>
      </div>
    );
  }

  const [{ data: progress }, { data: achievements }, workoutRes, skillRes] =
    await Promise.all([
      supabase.from("user_progress").select("total_xp, current_streak, longest_streak").eq("user_id", id).single(),
      supabase.from("user_achievements").select("achievement_id, unlocked_at, achievements(emoji, title)").eq("user_id", id),
      supabase.from("workout_sessions").select("id", { count: "exact", head: true }).eq("user_id", id),
      supabase.from("user_skills").select("id", { count: "exact", head: true }).eq("user_id", id).eq("status", "mastered"),
    ]);

  const workoutCount = workoutRes.count ?? 0;
  const skillCount = skillRes.count ?? 0;

  const isMe = user?.id === id;
  const memberSince = new Date(profile.created_at).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  const initial = (profile.display_name ?? "?").charAt(0).toUpperCase();

  return (
    <div className="flex min-h-screen flex-col bg-[color:var(--bg)]">
      <Header backLink={{ href: "/leaderboard", label: "← Ranking" }} />

      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-8">
        {/* Profile header */}
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-20 w-20 items-center justify-center rounded-full border-2 border-[color:var(--or)] bg-[color:var(--ord)] font-[family-name:var(--font-display)] text-3xl text-[color:var(--or)]">
            {initial}
          </div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl tracking-wider">
            {profile.display_name ?? "Anon"}
          </h1>
          <div className="mt-1 flex flex-wrap justify-center gap-2">
            {profile.region && (
              <span className="rounded-full bg-[color:var(--s2)] px-2.5 py-0.5 text-[10px] font-bold uppercase text-[color:var(--tx2)]">
                {REGION_LABELS[profile.region] ?? profile.region}
              </span>
            )}
            {profile.fitness_level != null && (
              <span className="rounded-full bg-[color:var(--ord)] px-2.5 py-0.5 text-[10px] font-bold uppercase text-[color:var(--or)]">
                {FITNESS_LABELS[profile.fitness_level]}
              </span>
            )}
          </div>
          <div className="mt-1 text-[10px] text-[color:var(--tx3)]">Membro desde {memberSince}</div>
          {isMe && (
            <Link href="/conta" className="mt-2 text-[10px] text-[color:var(--or)] underline">
              Editar perfil
            </Link>
          )}
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="ks-box">
            <div className="ks-v" style={{ color: "var(--or)" }}>{progress?.total_xp ?? 0}</div>
            <div className="ks-l">XP</div>
          </div>
          <div className="ks-box">
            <div className="ks-v" style={{ color: "var(--or)" }}>{progress?.current_streak ?? 0}</div>
            <div className="ks-l">Streak</div>
          </div>
          <div className="ks-box">
            <div className="ks-v">{workoutCount ?? 0}</div>
            <div className="ks-l">Treinos</div>
          </div>
          <div className="ks-box">
            <div className="ks-v" style={{ color: "var(--gn)" }}>{skillCount ?? 0}</div>
            <div className="ks-l">Skills</div>
          </div>
        </div>

        {/* Achievements */}
        {achievements && achievements.length > 0 && (
          <div>
            <div className="slbl mb-3">Conquistas ({achievements.length})</div>
            <div className="flex flex-wrap gap-2">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {(achievements as any[]).map((a: any) => (
                <div
                  key={a.achievement_id}
                  className="flex items-center gap-1.5 rounded-full border border-[color:var(--or)] bg-[color:var(--ord)] px-3 py-1.5"
                  title={a.achievements?.title ?? ""}
                >
                  <span className="text-base">{a.achievements?.emoji ?? "🏆"}</span>
                  <span className="font-[family-name:var(--font-condensed)] text-[10px] font-bold uppercase tracking-wider">
                    {a.achievements?.title ?? ""}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
