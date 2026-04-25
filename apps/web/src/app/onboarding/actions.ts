"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function calculatePhase(answers: Record<string, unknown>) {
  const level = answers.calisthenics_level as string;
  const pullups = answers.pullup_level as string;
  const freq = answers.exercise_frequency as string;

  let score = 0;
  if (level === "some") score += 1;
  if (level === "proficient") score += 3;
  if (pullups === "less_5") score += 1;
  if (pullups === "5_10") score += 2;
  if (pullups === "more_10") score += 3;
  if (freq === "several_month") score += 1;
  if (freq === "several_week") score += 2;
  if (freq === "daily") score += 3;

  if (score <= 1) return { phase: 0, startMonth: 0, fitnessLevel: 0 };
  if (score <= 3) return { phase: 0, startMonth: 2, fitnessLevel: 1 };
  if (score <= 6) return { phase: 1, startMonth: 4, fitnessLevel: 2 };
  return { phase: 2, startMonth: 8, fitnessLevel: 3 };
}

export async function saveOnboarding(answers: Record<string, unknown>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const phase = calculatePhase(answers);

  // Converte idade em anos (UI) pra birth_date (schema). Aproxima 01/jan
  // do ano de nascimento — granular o suficiente pro cálculo de BMR.
  let birthDate: string | null = null;
  const ageYears = Number(answers.age_years);
  if (Number.isFinite(ageYears) && ageYears >= 14 && ageYears <= 100) {
    const birthYear = new Date().getFullYear() - ageYears;
    birthDate = `${birthYear}-01-01`;
  }

  await supabase
    .from("profiles")
    .update({
      age_range: answers.age_range ?? null,
      body_type: answers.body_type ?? null,
      body_goal: answers.body_goal ?? null,
      calisthenics_level: answers.calisthenics_level ?? null,
      pullup_level: answers.pullup_level ?? null,
      flexibility: answers.flexibility ?? null,
      exercise_frequency: answers.exercise_frequency ?? null,
      target_zones: answers.target_zones ?? null,
      physical_issues: answers.physical_issues ?? null,
      preferred_location: answers.preferred_location ?? null,
      weekly_sessions: answers.weekly_sessions ?? null,
      workout_duration: answers.workout_duration ?? null,
      work_routine: answers.work_routine ?? null,
      daily_activity: answers.daily_activity ?? null,
      sleep_hours: answers.sleep_hours ?? null,
      water_intake: answers.water_intake ?? null,
      bad_habits: answers.bad_habits ?? null,
      height_cm: answers.height_cm ?? null,
      weight_kg: answers.weight_kg ?? null,
      target_weight_kg: answers.target_weight_kg ?? null,
      region: answers.region ?? null,
      goals: answers.goals ?? null,
      // Campos científicos pro calculador de macros (Mifflin-St Jeor + ISSN 2017)
      sex: answers.sex ?? null,
      birth_date: birthDate,
      activity_level: answers.activity_level ?? null,
      goal: answers.goal ?? null,
      equipment:
        Array.isArray(answers.equipment) && answers.equipment.length > 0
          ? answers.equipment
          : ["bodyweight"],
      skill_focus:
        answers.skill_focus === "none" ? null : (answers.skill_focus ?? null),
      fitness_level: phase.fitnessLevel,
      onboarding_completed: true,
    })
    .eq("id", user.id);

  await supabase
    .from("user_progress")
    .update({
      current_month: phase.startMonth,
      current_week: 0,
      current_day: 0,
    })
    .eq("user_id", user.id);

  redirect("/treino");
}
