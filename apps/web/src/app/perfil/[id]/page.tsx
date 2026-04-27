import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";

export const dynamic = "force-dynamic";

const FITNESS_LABELS = ["Iniciante", "Básico", "Intermediário", "Avançado"];
const REGION_LABELS: Record<string, string> = {
  nordeste: "Nordeste",
  sudeste: "Sudeste",
  sul: "Sul",
  norte: "Norte",
  centro_oeste: "Centro-Oeste",
};

const CATEGORY_LABEL: Record<string, string> = {
  streak: "Constância",
  xp: "Experiência",
  workout: "Treinos",
  exercise: "Exercícios",
  special: "Especial",
};
const CATEGORY_COLOR: Record<string, string> = {
  streak: "var(--or)",
  xp: "var(--gn)",
  workout: "#facc15",
  exercise: "#3b82f6",
  special: "#a855f7",
};

type Achievement = {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  emoji: string;
  category: string;
  unlocked_at: string;
  sort_order: number;
};

type PublicProfileData = {
  profile: {
    id: string;
    display_name: string | null;
    region: string | null;
    fitness_level: number | null;
    created_at: string;
  };
  progress: {
    total_xp: number;
    current_streak: number;
    longest_streak: number;
    last_workout_at: string | null;
  };
  workout_count: number;
  skill_count: number;
  achievements: Achievement[];
};

function daysSince(iso: string | null): number | null {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return null;
  return Math.max(0, Math.floor((Date.now() - then) / (1000 * 60 * 60 * 24)));
}

export default async function PerfilPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // RPC publico (security definer) — bypassa RLS pra ler perfil de outras
  // pessoas, mas so retorna campos seguros (sem peso/altura/idade/sexo/etc).
  const { data: rpcData, error: rpcError } = await supabase.rpc(
    "get_public_profile",
    { p_user_id: id },
  );

  if (rpcError || !rpcData) {
    return (
      <div className="flex min-h-screen flex-col bg-[color:var(--bg)]">
        <Header backLink={{ href: "/leaderboard", label: "← Ranking" }} />
        <main className="flex flex-1 items-center justify-center px-6">
          <div className="text-center">
            <div className="mb-3 text-5xl">👤</div>
            <h1 className="font-[family-name:var(--font-display)] text-xl tracking-wider">
              PERFIL NÃO ENCONTRADO
            </h1>
            <p className="mt-2 text-xs text-[color:var(--tx3)]">
              Este usuário ainda não preencheu o perfil ou foi removido.
            </p>
            <Link
              href="/leaderboard"
              className="mt-6 inline-block rounded-md bg-[color:var(--or)] px-5 py-2 font-[family-name:var(--font-condensed)] text-[12px] font-bold uppercase tracking-[1.5px] text-black"
            >
              Voltar pro Ranking
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const data = rpcData as PublicProfileData;
  const { profile, progress, workout_count, skill_count, achievements } = data;
  const isMe = user?.id === profile.id;
  const memberSince = new Date(profile.created_at).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
  const initial = (profile.display_name ?? "?").charAt(0).toUpperCase();
  const lastWorkoutDays = daysSince(progress.last_workout_at);

  return (
    <div className="flex min-h-screen flex-col bg-[color:var(--bg)]">
      <Header backLink={{ href: "/leaderboard", label: "← Ranking" }} />

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 pb-20">
        {/* Profile header */}
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-24 w-24 items-center justify-center rounded-full border-2 border-[color:var(--or)] bg-[color:var(--ord)] font-[family-name:var(--font-display)] text-4xl text-[color:var(--or)]">
            {initial}
          </div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl tracking-wider">
            {profile.display_name ?? "Anônimo"}
          </h1>
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            {profile.region && (
              <span className="rounded-full bg-[color:var(--s2)] px-3 py-1 font-[family-name:var(--font-condensed)] text-[10px] font-bold uppercase tracking-wider text-[color:var(--tx2)]">
                📍 {REGION_LABELS[profile.region] ?? profile.region}
              </span>
            )}
            {profile.fitness_level != null && (
              <span className="rounded-full bg-[color:var(--ord)] px-3 py-1 font-[family-name:var(--font-condensed)] text-[10px] font-bold uppercase tracking-wider text-[color:var(--or)]">
                💪 {FITNESS_LABELS[profile.fitness_level]}
              </span>
            )}
          </div>
          <div className="mt-2 text-[11px] text-[color:var(--tx3)]">
            Membro desde {memberSince}
          </div>
          {lastWorkoutDays != null && (
            <div className="mt-1 font-[family-name:var(--font-mono)] text-[10px] text-[color:var(--tx3)]">
              {lastWorkoutDays === 0
                ? "Treinou hoje 🔥"
                : lastWorkoutDays === 1
                  ? "Último treino: ontem"
                  : `Último treino: há ${lastWorkoutDays} dias`}
            </div>
          )}
          {isMe && (
            <Link
              href="/conta"
              className="mt-3 text-[11px] text-[color:var(--or)] underline underline-offset-2"
            >
              Editar meu perfil
            </Link>
          )}
        </div>

        {/* Stats — 4 cards, responsivo (2x2 mobile, 4 col desktop) */}
        <div className="mb-8 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="ks-box">
            <div className="ks-v" style={{ color: "var(--or)" }}>
              {progress.total_xp}
            </div>
            <div className="ks-l">XP Total</div>
          </div>
          <div className="ks-box">
            <div className="ks-v" style={{ color: "var(--or)" }}>
              {progress.current_streak}
            </div>
            <div className="ks-l">Streak</div>
          </div>
          <div className="ks-box">
            <div className="ks-v" style={{ color: "var(--gn)" }}>
              {progress.longest_streak}
            </div>
            <div className="ks-l">Recorde</div>
          </div>
          <div className="ks-box">
            <div className="ks-v">{workout_count}</div>
            <div className="ks-l">Treinos</div>
          </div>
        </div>

        {/* Achievements */}
        <div className="mb-3 flex items-baseline justify-between">
          <div className="slbl">
            Conquistas {achievements.length > 0 && `(${achievements.length})`}
          </div>
          {skill_count > 0 && (
            <div className="font-[family-name:var(--font-condensed)] text-[10px] uppercase tracking-[1.5px] text-[color:var(--tx3)]">
              + {skill_count} skill{skill_count !== 1 ? "s" : ""} dominada{skill_count !== 1 ? "s" : ""}
            </div>
          )}
        </div>

        {achievements.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[color:var(--bd)] bg-[color:var(--s1)] px-6 py-10 text-center">
            <div className="mb-3 text-4xl">🏆</div>
            <h3 className="mb-1 font-[family-name:var(--font-display)] text-base tracking-wider">
              SEM CONQUISTAS AINDA
            </h3>
            <p className="text-xs text-[color:var(--tx3)]">
              {isMe
                ? "Bora começar a treinar pra desbloquear seus primeiros badges."
                : "Este usuário ainda não desbloqueou conquistas."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {achievements.map((a) => {
              const color = CATEGORY_COLOR[a.category] ?? "var(--or)";
              const dateStr = new Date(a.unlocked_at).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              });
              return (
                <div
                  key={a.id}
                  className="rounded-xl border bg-[color:var(--s1)] p-4 transition-colors hover:bg-[color:var(--s2)]"
                  style={{ borderColor: `${color}55` }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-2xl"
                      style={{ background: `${color}1a` }}
                    >
                      {a.emoji}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="truncate font-bold text-[13px] text-[color:var(--tx)]">
                          {a.title}
                        </h4>
                        <span
                          className="shrink-0 rounded-sm px-1.5 py-0.5 font-[family-name:var(--font-condensed)] text-[9px] font-bold uppercase tracking-wider"
                          style={{ background: `${color}1a`, color }}
                        >
                          {CATEGORY_LABEL[a.category] ?? a.category}
                        </span>
                      </div>
                      {a.description && (
                        <p className="mt-1 text-[11px] leading-relaxed text-[color:var(--tx3)]">
                          {a.description}
                        </p>
                      )}
                      <div className="mt-2 font-[family-name:var(--font-mono)] text-[10px] text-[color:var(--tx3)]">
                        Desbloqueado em {dateStr}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
