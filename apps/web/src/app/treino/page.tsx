import { createClient } from "@/lib/supabase/server";
import { PlanExplorer, type Month, type PlanDay } from "./plan-explorer";

export const dynamic = "force-dynamic";

export default async function TreinoPage() {
  const supabase = await createClient();

  const [{ data: monthsData }, { data: daysData }, { data: volumeData }] = await Promise.all([
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
              slug,
              name,
              muscle_group,
              kcal_estimate,
              modifier,
              youtube_search_url
            )
          )
        `,
      )
      .order("phase_id")
      .order("day_index"),
    supabase.from("week_volume").select("week_index, multiplier").order("week_index"),
  ]);

  const months = (monthsData ?? []) as Month[];
  const days = (daysData ?? []) as unknown as PlanDay[];
  const weekVolume = (volumeData ?? []).map((v) => Number(v.multiplier));

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

  return <PlanExplorer months={months} days={days} weekVolume={weekVolume} />;
}
