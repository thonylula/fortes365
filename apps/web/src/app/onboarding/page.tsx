import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { QuizFlow } from "./quiz-flow";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/onboarding");

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed, region, fitness_level, goals, body_type, body_goal, calisthenics_level, pullup_level, flexibility, exercise_frequency, age_range, target_zones, physical_issues, preferred_location, weekly_sessions, workout_duration, work_routine, daily_activity, sleep_hours, water_intake, bad_habits, height_cm, weight_kg, target_weight_kg")
    .eq("id", user.id)
    .single();

  if (profile?.onboarding_completed) redirect("/treino");

  const initialData: Record<string, unknown> = {};
  if (profile) {
    for (const [key, val] of Object.entries(profile)) {
      if (val != null && key !== "onboarding_completed") {
        initialData[key] = val;
      }
    }
  }

  return <QuizFlow initialData={initialData} />;
}
