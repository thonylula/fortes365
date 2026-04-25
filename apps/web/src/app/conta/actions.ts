"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { sendAccountDeletedEmail } from "@/lib/email";
import { containsProfanity } from "@/lib/profanity-filter";
import {
  generatePlan,
  type ExerciseMeta,
  type PlanDayLite,
  type UserProfile,
} from "@/lib/plan-generator";

const FEEDBACK_CATEGORIES = new Set(["sugestao", "bug", "elogio", "outro"]);

const VALID_SEX = new Set(["M", "F", "O"]);
const VALID_ACTIVITY = new Set(["sedentary", "light", "moderate", "very", "extreme"]);
const VALID_GOAL = new Set(["cutting", "maintenance", "bulking"]);

export async function saveUserMetrics(formData: FormData): Promise<{
  ok: boolean;
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Faça login para salvar seu perfil." };

  const weight = Number(formData.get("weight_kg"));
  const height = Number(formData.get("height_cm"));
  const sex = String(formData.get("sex") ?? "");
  const birth_date = String(formData.get("birth_date") ?? "");
  const activity = String(formData.get("activity_level") ?? "");
  const goal = String(formData.get("goal") ?? "");

  if (!Number.isFinite(weight) || weight < 30 || weight > 300) {
    return { ok: false, error: "Peso inválido (30-300kg)." };
  }
  if (!Number.isFinite(height) || height < 100 || height > 250) {
    return { ok: false, error: "Altura inválida (100-250cm)." };
  }
  if (!VALID_SEX.has(sex)) return { ok: false, error: "Sexo inválido." };
  if (!birth_date || !/^\d{4}-\d{2}-\d{2}$/.test(birth_date)) {
    return { ok: false, error: "Data de nascimento inválida." };
  }
  if (!VALID_ACTIVITY.has(activity)) return { ok: false, error: "Nível de atividade inválido." };
  if (!VALID_GOAL.has(goal)) return { ok: false, error: "Objetivo inválido." };

  const { error } = await supabase
    .from("profiles")
    .update({
      weight_kg: weight,
      height_cm: Math.round(height),
      sex,
      birth_date,
      activity_level: activity,
      goal,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return { ok: false, error: "Não foi possível salvar. Tente de novo." };
  }

  revalidatePath("/conta");
  revalidatePath("/compras");
  revalidatePath("/nutricao");
  return { ok: true };
}

export async function submitFeedback(formData: FormData): Promise<{
  ok: boolean;
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Faca login para enviar sugestoes." };

  const category = String(formData.get("category") ?? "sugestao").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!FEEDBACK_CATEGORIES.has(category)) {
    return { ok: false, error: "Categoria invalida." };
  }
  if (message.length < 10) {
    return { ok: false, error: "Sua sugestao precisa ter pelo menos 10 caracteres." };
  }
  if (message.length > 500) {
    return { ok: false, error: "Sua sugestao passou de 500 caracteres. Sintetize um pouco." };
  }
  const distinctWords = new Set(
    message.toLowerCase().split(/\s+/).filter((w) => w.length > 1),
  );
  if (distinctWords.size < 3) {
    return { ok: false, error: "Escreva uma mensagem mais descritiva (pelo menos 3 palavras)." };
  }
  if (containsProfanity(message)) {
    return {
      ok: false,
      error: "Sua mensagem contem linguagem inadequada. Reescreva com respeito.",
    };
  }

  const { error } = await supabase.from("feedback").insert({
    user_id: user.id,
    category,
    message,
  });
  if (error) return { ok: false, error: "Nao consegui salvar. Tente de novo em instantes." };

  revalidatePath("/conta");
  return { ok: true };
}

export async function exportUserData() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const [
    { data: profile },
    { data: progress },
    { data: workouts },
    { data: achievements },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("user_progress").select("*").eq("user_id", user.id).single(),
    supabase.from("workout_sessions").select("*").eq("user_id", user.id),
    supabase.from("user_achievements").select("*").eq("user_id", user.id),
  ]);

  return {
    exported_at: new Date().toISOString(),
    user: { id: user.id, email: user.email, created_at: user.created_at },
    profile,
    progress,
    workouts: workouts ?? [],
    achievements: achievements ?? [],
  };
}

export async function deleteAccount() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const email = user.email;

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  await admin.from("push_subscriptions").delete().eq("user_id", user.id);
  await admin.from("user_achievements").delete().eq("user_id", user.id);
  await admin.from("workout_sessions").delete().eq("user_id", user.id);
  await admin.from("user_progress").delete().eq("user_id", user.id);
  await admin.from("meal_log").delete().eq("user_id", user.id);
  await admin.from("subscriptions").delete().eq("user_id", user.id);
  await admin.from("profiles").delete().eq("id", user.id);
  await admin.auth.admin.deleteUser(user.id);

  if (email) {
    try {
      await sendAccountDeletedEmail(email);
    } catch (err) {
      console.error("[conta/actions] deletion email failed:", err);
    }
  }

  return { ok: true };
}

export async function saveReview(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const rating = Number(formData.get("rating"));
  const body = String(formData.get("body") ?? "").trim().slice(0, 500);

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    redirect("/conta?reviewError=Selecione+uma+nota+de+1+a+5");
  }

  const { error } = await supabase.from("reviews").upsert(
    {
      user_id: user.id,
      rating,
      body,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) {
    redirect(`/conta?reviewError=${encodeURIComponent(error.message)}`);
  }

  redirect("/conta?reviewSaved=1");
}

export async function regeneratePlan(): Promise<{
  ok: boolean;
  error?: string;
  daysGenerated?: number;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthenticated" };

  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select(
      "fitness_level, calisthenics_level, weekly_sessions, workout_duration, equipment, skill_focus, physical_issues",
    )
    .eq("id", user.id)
    .single();

  if (profileErr || !profile) {
    return { ok: false, error: "profile_not_found" };
  }

  const [{ data: exercises, error: exErr }, { data: planDays, error: pdErr }] =
    await Promise.all([
      supabase
        .from("exercises")
        .select(
          "id, slug, min_level, movement_pattern, equipment, contraindications, skill_tag, is_unilateral, is_explosive, time_based",
        ),
      supabase.from("plan_days").select("id, phase_id, day_index, type"),
    ]);

  if (exErr || pdErr || !exercises || !planDays) {
    return { ok: false, error: "fetch_failed" };
  }

  const userProfile: UserProfile = {
    fitness_level: profile.fitness_level,
    calisthenics_level: profile.calisthenics_level,
    weekly_sessions: profile.weekly_sessions,
    workout_duration: profile.workout_duration,
    equipment: profile.equipment ?? ["bodyweight"],
    skill_focus: profile.skill_focus,
    physical_issues: profile.physical_issues,
  };

  const generated = generatePlan(
    userProfile,
    exercises as ExerciseMeta[],
    planDays as PlanDayLite[],
  );

  // Apaga overrides antigos do user e insere os novos
  const { error: delErr } = await supabase
    .from("user_plan_day_exercises")
    .delete()
    .eq("user_id", user.id);
  if (delErr) return { ok: false, error: "delete_old_failed" };

  const rows = generated.flatMap((day) =>
    day.exercises.map((ex) => ({
      user_id: user.id,
      plan_day_id: day.plan_day_id,
      exercise_id: ex.exercise_id,
      position: ex.position,
      sets: ex.sets,
      reps: ex.reps,
      rest: ex.rest,
    })),
  );

  if (rows.length > 0) {
    const { error: insErr } = await supabase
      .from("user_plan_day_exercises")
      .insert(rows);
    if (insErr) return { ok: false, error: "insert_failed" };
  }

  await supabase
    .from("profiles")
    .update({ plan_generated_at: new Date().toISOString() })
    .eq("id", user.id);

  revalidatePath("/treino");

  return { ok: true, daysGenerated: generated.length };
}
