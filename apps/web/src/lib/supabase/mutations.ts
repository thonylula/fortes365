"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "./server";

export async function toggleExerciseDone(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Não autenticado" };

  const planDayId = formData.get("planDayId") as string;
  const exerciseSlug = formData.get("exerciseSlug") as string;
  const monthId = Number(formData.get("monthId"));
  const weekIndex = Number(formData.get("weekIndex"));
  const dayIndex = Number(formData.get("dayIndex"));
  const sets = Number(formData.get("sets") || 0);
  const reps = formData.get("reps") as string;
  const isDone = formData.get("isDone") === "true";

  const { data: exercise } = await supabase
    .from("exercises")
    .select("id")
    .eq("slug", exerciseSlug)
    .single();

  if (!exercise) return { error: "Exercício não encontrado" };

  // Busca ou cria sessão para este dia/semana/mês do usuário.
  let { data: session } = await supabase
    .from("workout_sessions")
    .select("id")
    .eq("user_id", user.id)
    .eq("plan_day_id", planDayId)
    .eq("month_id", monthId)
    .eq("week_index", weekIndex)
    .maybeSingle();

  if (!session) {
    const { data: newSession, error } = await supabase
      .from("workout_sessions")
      .insert({
        user_id: user.id,
        plan_day_id: planDayId,
        month_id: monthId,
        week_index: weekIndex,
        day_index: dayIndex,
      })
      .select("id")
      .single();
    if (error) return { error: error.message };
    session = newSession;
  }

  if (isDone) {
    // Desmarcar: remove o set logado.
    await supabase
      .from("exercise_sets")
      .delete()
      .eq("session_id", session.id)
      .eq("exercise_id", exercise.id);
  } else {
    // Marcar como feito: insere sets logados.
    const setsToInsert = Array.from({ length: Math.max(sets, 1) }, (_, i) => ({
      session_id: session.id,
      exercise_id: exercise.id,
      position: i,
      reps: reps ? parseInt(reps) || null : null,
    }));
    await supabase.from("exercise_sets").insert(setsToInsert);
  }

  // Atualiza progresso do usuário.
  await updateUserProgress(supabase, user.id);

  revalidatePath("/treino");
  return { success: true };
}

async function updateUserProgress(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
) {
  const { count: totalWorkouts } = await supabase
    .from("workout_sessions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  const xp = (totalWorkouts ?? 0) * 50;

  const { data: sessions } = await supabase
    .from("workout_sessions")
    .select("started_at")
    .eq("user_id", userId)
    .order("started_at", { ascending: false })
    .limit(60);

  let currentStreak = 0;
  if (sessions && sessions.length > 0) {
    const dates = [...new Set(
      sessions.map((s) =>
        new Date(s.started_at).toISOString().slice(0, 10),
      ),
    )].sort().reverse();

    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    if (dates[0] === today || dates[0] === yesterday) {
      currentStreak = 1;
      for (let i = 1; i < dates.length; i++) {
        const prev = new Date(dates[i - 1]);
        const curr = new Date(dates[i]);
        const diffDays = (prev.getTime() - curr.getTime()) / 86400000;
        if (diffDays <= 1.5) {
          currentStreak++;
        } else {
          break;
        }
      }
    }
  }

  const { data: existing } = await supabase
    .from("user_progress")
    .select("longest_streak")
    .eq("user_id", userId)
    .single();

  const longestStreak = Math.max(existing?.longest_streak ?? 0, currentStreak);

  await supabase
    .from("user_progress")
    .update({
      total_xp: xp,
      current_streak: currentStreak,
      longest_streak: longestStreak,
      last_workout_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);
}

export async function getCompletedExercises(
  planDayId: string,
  monthId: number,
  weekIndex: number,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return new Set<string>();

  const { data: session } = await supabase
    .from("workout_sessions")
    .select("id")
    .eq("user_id", user.id)
    .eq("plan_day_id", planDayId)
    .eq("month_id", monthId)
    .eq("week_index", weekIndex)
    .maybeSingle();

  if (!session) return new Set<string>();

  const { data: sets } = await supabase
    .from("exercise_sets")
    .select("exercise_id, exercises(slug)")
    .eq("session_id", session.id);

  const slugs = new Set<string>();
  if (sets) {
    for (const s of sets) {
      const ex = s.exercises as unknown as { slug: string } | null;
      if (ex?.slug) slugs.add(ex.slug);
    }
  }
  return slugs;
}
