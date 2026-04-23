import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ensureAdmin } from "@/lib/admin";
import { getMyReview } from "@/lib/reviews";
import { logout } from "../login/actions";
import { RegionSelector } from "./region-selector";
import { AchievementSummary } from "./achievement-summary";
import { ReviewForm } from "./review-form";
import { FeedbackForm } from "./feedback-form";
import { HealthIntegration } from "./health-integration";
import { PlanRegenerator } from "./plan-regenerator";
import { SubscriptionCard } from "./subscription-card";

export default async function ContaPage({
  searchParams,
}: {
  searchParams: Promise<{
    reviewSaved?: string;
    reviewError?: string;
    healthConnected?: string;
    healthError?: string;
  }>;
}) {
  const { reviewSaved, reviewError, healthConnected, healthError } =
    await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/conta");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, fitness_level, region, created_at, plan_generated_at")
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

  const myReview = await getMyReview();

  const adminCheck = await ensureAdmin(supabase);
  const isAdmin = adminCheck.ok;

  const { data: activeSub } = await supabase
    .from("subscriptions")
    .select("tier, status, current_period_end, cancel_at_period_end")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  const healthEnabled = !!process.env.GOOGLE_OAUTH_CLIENT_ID;

  let healthConnectedState = false;
  let lastSyncAt: string | null = null;
  if (healthEnabled) {
    try {
      const { data: integration } = await supabase
        .from("health_integrations")
        .select("last_sync_at")
        .eq("user_id", user.id)
        .maybeSingle();
      if (integration) {
        healthConnectedState = true;
        lastSyncAt = integration.last_sync_at ?? null;
      }
    } catch {
      // Tabela nao existe ainda (migration 0012 nao rodou)
    }
  }

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

          <div className="rounded-lg border border-[color:var(--bd)] bg-[color:var(--s1)] p-5">
            <div className="slbl mb-3">Sua avaliação</div>
            <p className="mb-4 text-xs text-[color:var(--tx3)]">
              Sua nota aparece publicamente na landing quando houver pelo menos 3 avaliações.
            </p>
            <ReviewForm
              existing={myReview}
              saved={reviewSaved === "1"}
              errorMessage={reviewError}
            />
          </div>

          <div className="rounded-lg border border-[color:var(--bd)] bg-[color:var(--s1)] p-5">
            <div className="slbl mb-3">Enviar sugestão</div>
            <p className="mb-4 text-xs text-[color:var(--tx3)]">
              Tem ideia do que melhorar? Achou um bug? Conte aqui — leio cada mensagem.
            </p>
            <FeedbackForm />
          </div>

          <RegionSelector currentRegion={profile?.region ?? null} />

          <PlanRegenerator generatedAt={profile?.plan_generated_at ?? null} />

          {healthEnabled && (
            <HealthIntegration
              connected={healthConnectedState}
              lastSyncAt={lastSyncAt}
              justConnected={healthConnected === "1"}
              errorCode={healthError ?? null}
            />
          )}

          {isAdmin && (
            <div className="rounded-lg border border-[color:var(--or)]/40 bg-[color:var(--ord)] p-5">
              <div className="mb-1 font-[family-name:var(--font-condensed)] text-[10px] font-bold uppercase tracking-[2px] text-[color:var(--or)]">
                🛠 Área DEV
              </div>
              <div className="mb-3 text-sm font-bold">
                Sugestões de todos os usuários
              </div>
              <p className="mb-4 text-xs text-[color:var(--tx3)]">
                Você é admin. Veja aqui o que chegou da galera — filtrado por categoria, com email do remetente pra responder.
              </p>
              <Link
                href="/admin/feedback"
                className="inline-flex h-10 items-center justify-center rounded-sm bg-[color:var(--or)] px-4 font-[family-name:var(--font-condensed)] text-[12px] font-bold uppercase tracking-[2px] text-black transition-colors hover:bg-[#ff7733]"
              >
                Abrir painel →
              </Link>
            </div>
          )}

          <SubscriptionCard sub={activeSub} />
        </div>

        {/* LGPD — Dados do usuario */}
        <div className="mt-8 rounded-lg border border-[color:var(--bd)] bg-[color:var(--s1)] p-5">
          <div className="slbl mb-3">Seus dados</div>
          <div className="flex gap-2">
            <a
              href="/api/export-data"
              className="flex-1 rounded-md border border-[color:var(--bd)] bg-[color:var(--s2)] py-2 text-center font-[family-name:var(--font-condensed)] text-[11px] font-bold uppercase tracking-wider text-[color:var(--tx2)] transition-colors hover:border-[color:var(--or)] hover:text-[color:var(--or)]"
            >
              Exportar dados
            </a>
            <a
              href="/conta/excluir"
              className="flex-1 rounded-md border border-red-500/20 bg-red-500/5 py-2 text-center font-[family-name:var(--font-condensed)] text-[11px] font-bold uppercase tracking-wider text-red-400/70 transition-colors hover:border-red-500/40 hover:text-red-400"
            >
              Excluir conta
            </a>
          </div>
          <p className="mt-2 text-[10px] text-[color:var(--tx3)]">
            Conforme LGPD, voce pode exportar ou excluir todos os seus dados a qualquer momento.
          </p>
        </div>

        <form action={logout} className="mt-4">
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
