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

  // Checa conquistas novas
  const newAchievements = isDone ? [] : await checkAchievements(supabase, user.id);

  revalidatePath("/treino");
  return { success: true, newAchievements };
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

async function checkAchievements(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<{ slug: string; title: string; emoji: string }[]> {
  const { data: progress } = await supabase
    .from("user_progress")
    .select("total_xp, current_streak")
    .eq("user_id", userId)
    .single();

  if (!progress) return [];

  const { count: totalWorkouts } = await supabase
    .from("workout_sessions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  // Count total exercises done by this user (via their sessions)
  const { data: userSessions } = await supabase
    .from("workout_sessions")
    .select("id")
    .eq("user_id", userId);

  let exerciseCount = 0;
  if (userSessions && userSessions.length > 0) {
    const sessionIds = userSessions.map(s => s.id);
    const { count } = await supabase
      .from("exercise_sets")
      .select("id", { count: "exact", head: true })
      .in("session_id", sessionIds);
    exerciseCount = count ?? 0;
  }

  const stats = {
    streak: progress.current_streak ?? 0,
    xp: progress.total_xp ?? 0,
    workout: totalWorkouts ?? 0,
    exercise: exerciseCount,
  };

  // Get all achievements not yet unlocked
  const { data: allAchievements } = await supabase
    .from("achievements")
    .select("id, slug, title, emoji, category, threshold");

  const { data: unlocked } = await supabase
    .from("user_achievements")
    .select("achievement_id")
    .eq("user_id", userId);

  const unlockedIds = new Set((unlocked ?? []).map(u => u.achievement_id));
  const newlyUnlocked: { slug: string; title: string; emoji: string }[] = [];

  for (const a of allAchievements ?? []) {
    if (unlockedIds.has(a.id)) continue;
    const cat = a.category as string;
    if (!(cat in stats)) continue;
    if (stats[cat as keyof typeof stats] >= a.threshold) {
      await supabase.from("user_achievements").insert({
        user_id: userId,
        achievement_id: a.id,
      });
      newlyUnlocked.push({ slug: a.slug, title: a.title, emoji: a.emoji });
    }
  }

  return newlyUnlocked;
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

export async function swapExercise(formData: FormData): Promise<{
  ok: boolean;
  error?: string;
  newExerciseName?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthenticated" };

  const planDayId = formData.get("planDayId") as string;
  const position = Number(formData.get("position"));
  const currentSlug = formData.get("currentSlug") as string;

  if (!planDayId || !currentSlug || !Number.isInteger(position)) {
    return { ok: false, error: "invalid_input" };
  }

  // 1. Busca exercise atual + lista de alternativas
  const { data: current } = await supabase
    .from("exercises")
    .select("id, alternatives")
    .eq("slug", currentSlug)
    .single();

  if (!current?.alternatives?.length) {
    return { ok: false, error: "no_alternatives" };
  }

  // 2. Pega primeiro alternative que nao seja o proprio exercicio
  const altSlug = (current.alternatives as string[]).find(
    (s) => s !== currentSlug,
  );
  if (!altSlug) return { ok: false, error: "no_alternatives" };

  const { data: alt } = await supabase
    .from("exercises")
    .select("id, name")
    .eq("slug", altSlug)
    .single();
  if (!alt) return { ok: false, error: "alternative_not_found" };

  // 3. Ve se o user ja tem override pra esse plan_day
  const { count: overrideCount } = await supabase
    .from("user_plan_day_exercises")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("plan_day_id", planDayId);

  // 4. Se nao tem override, copia o plano global do plan_day inteiro primeiro
  if (!overrideCount) {
    const { data: globalRows } = await supabase
      .from("plan_day_exercises")
      .select("exercise_id, position, sets, reps, rest")
      .eq("plan_day_id", planDayId);

    if (globalRows && globalRows.length > 0) {
      const insertRows = globalRows.map((row) => ({
        user_id: user.id,
        plan_day_id: planDayId,
        exercise_id: row.exercise_id,
        position: row.position,
        sets: row.sets ?? 3,
        reps: row.reps,
        rest: row.rest,
      }));
      const { error: insErr } = await supabase
        .from("user_plan_day_exercises")
        .insert(insertRows);
      if (insErr) return { ok: false, error: "copy_global_failed" };
    }
  }

  // 5. Troca o exercise_id na posicao especifica
  const { error: updErr } = await supabase
    .from("user_plan_day_exercises")
    .update({ exercise_id: alt.id })
    .eq("user_id", user.id)
    .eq("plan_day_id", planDayId)
    .eq("position", position);

  if (updErr) return { ok: false, error: "swap_failed" };

  revalidatePath("/treino");

  return { ok: true, newExerciseName: alt.name };
}
