import { createClient } from "@/lib/supabase/server";
import { getCompletedExercises } from "@/lib/supabase/mutations";
import { getSubscriptionInfo } from "@/lib/supabase/guards";
import { PlanExplorer, type Month, type PlanDay, type CatalogEntry } from "./plan-explorer";

export const dynamic = "force-dynamic";

export default async function TreinoPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [
    { data: monthsData },
    { data: daysData },
    { data: volumeData },
    { data: catalogData },
  ] = await Promise.all([
    supabase
      .from("months")
      .select("id, short_name, name, phase_label, phase_css_class, icon, level, has_bike, season")
      .order("id"),
    supabase
      .from("plan_days")
      .select(
        `
          id,
          phase_id,
          day_index,
          type,
          focus,
          tip,
          cover_key,
          distance,
          zone,
          kcal_estimate,
          message,
          raw,
          plan_day_exercises (
            position,
            sets,
            reps,
            rest,
            exercises (
              id,
              slug,
              name,
              muscle_group,
              kcal_estimate,
              modifier,
              youtube_search_url,
              alternatives
            )
          )
        `,
      )
      .order("phase_id")
      .order("day_index"),
    supabase.from("week_volume").select("week_index, multiplier").order("week_index"),
    supabase
      .from("exercises")
      .select("id, slug, name, muscle_group, kcal_estimate, modifier")
      .order("name"),
  ]);

  const months = (monthsData ?? []) as Month[];
  let days = (daysData ?? []) as unknown as PlanDay[];
  const weekVolume = (volumeData ?? []).map((v) => Number(v.multiplier));
  const exerciseCatalog = (catalogData ?? []) as CatalogEntry[];

  // Se o user tem plano personalizado, usa o override no lugar do global
  if (user) {
    try {
      const { data: overrides } = await supabase
        .from("user_plan_day_exercises")
        .select(
          `
            plan_day_id,
            position,
            sets,
            reps,
            rest,
            custom_name,
            custom_muscle,
            custom_cue,
            custom_kcal,
            exercises (
              id,
              slug,
              name,
              muscle_group,
              kcal_estimate,
              modifier,
              youtube_search_url,
              alternatives
            )
          `,
        )
        .eq("user_id", user.id)
        .order("position");

      if (overrides && overrides.length > 0) {
        // Max position no plano global de cada plan_day, pra marcar linhas
        // adicionadas pelo user (position > max => addedByUser).
        const maxGlobalByPlanDay = new Map<string, number>();
        for (const d of days) {
          let max = -1;
          for (const ex of d.plan_day_exercises ?? []) {
            if (ex.position > max) max = ex.position;
          }
          maxGlobalByPlanDay.set(d.id, max);
        }

        const byPlanDay = new Map<string, unknown[]>();
        for (const ov of overrides as unknown as Array<{
          plan_day_id: string;
          position: number;
          sets: number;
          reps: string | null;
          rest: string | null;
          custom_name: string | null;
          custom_muscle: string | null;
          custom_cue: string | null;
          custom_kcal: number | null;
          exercises: unknown;
        }>) {
          const maxGlobal = maxGlobalByPlanDay.get(ov.plan_day_id) ?? -1;
          const list = byPlanDay.get(ov.plan_day_id) ?? [];
          list.push({
            position: ov.position,
            sets: ov.sets,
            reps: ov.reps,
            rest: ov.rest,
            exercises: ov.exercises,
            custom_name: ov.custom_name,
            custom_muscle: ov.custom_muscle,
            custom_cue: ov.custom_cue,
            custom_kcal: ov.custom_kcal,
            added_by_user: ov.position > maxGlobal,
          });
          byPlanDay.set(ov.plan_day_id, list);
        }
        days = days.map((d) => {
          const override = byPlanDay.get(d.id);
          if (override && override.length > 0) {
            return { ...d, plan_day_exercises: override as PlanDay["plan_day_exercises"] };
          }
          return d;
        });
      }
    } catch {
      // Tabela user_plan_day_exercises pode nao existir ainda (migration 0015 nao aplicada)
    }
  }

  if (months.length === 0 || days.length === 0) {
    return (
      <main className="flex flex-1 items-center justify-center p-8">
        <div className="max-w-md rounded-md border border-red-500/40 bg-red-500/10 p-5 text-sm text-red-300">
          <p className="font-semibold">Sem dados retornados do Supabase.</p>
          <p className="mt-1 text-xs">
            Confirme <code>.env.local</code> e se <code>seed.sql</code> foi executado.
          </p>
        </div>
      </main>
    );
  }

  const userInfo = user
    ? { email: user.email ?? "", name: user.user_metadata?.display_name as string | undefined }
    : null;

  const subInfo = await getSubscriptionInfo();

  const firstDay = (days as PlanDay[]).find((d) => d.phase_id === 0 && d.day_index === 0);
  let initialCompleted: string[] = [];
  if (user && firstDay) {
    const slugs = await getCompletedExercises(firstDay.id, 0, 0);
    initialCompleted = [...slugs];
  }

  return (
    <PlanExplorer
      months={months}
      days={days}
      weekVolume={weekVolume}
      exerciseCatalog={exerciseCatalog}
      user={userInfo}
      initialCompleted={initialCompleted}
      isPremium={subInfo.isPremium}
      freeMonths={subInfo.freeMonths}
    />
  );
}
