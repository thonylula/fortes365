/**
 * Motor de geracao de plano personalizado.
 *
 * Funcao pura: dado o profile do usuario, o banco de exercicios e a lista de
 * plan_days, retorna um array de overrides a gravar em user_plan_day_exercises.
 */

export type ExerciseMeta = {
  id: string;
  slug: string;
  min_level: number;
  movement_pattern: string | null;
  equipment: string[];
  contraindications: string[];
  skill_tag: string | null;
  is_unilateral: boolean;
  is_explosive: boolean;
  time_based: boolean;
};

export type PlanDayLite = {
  id: string;
  phase_id: number;
  day_index: number;
  type: string;
};

export type UserProfile = {
  fitness_level: number | null;
  calisthenics_level: string | null;
  weekly_sessions: string | null;
  workout_duration: string | null;
  equipment: string[];
  skill_focus: string | null;
  physical_issues: string[] | null;
};

export type GeneratedExercise = {
  exercise_id: string;
  position: number;
  sets: number;
  reps: string;
  rest: string;
};

export type GeneratedDay = {
  plan_day_id: string;
  exercises: GeneratedExercise[];
};

type DayFocus = "push" | "pull" | "legs" | "full_body" | "skill" | "core";

// Maps fitness_level (0-3) + calisthenics_level pro nivel maximo do banco (1-12)
function maxLevelFor(profile: UserProfile): number {
  const base = (profile.fitness_level ?? 0) * 3; // 0, 3, 6, 9
  const bonus =
    profile.calisthenics_level === "proficient"
      ? 2
      : profile.calisthenics_level === "some"
        ? 1
        : 0;
  return Math.min(12, base + bonus + 1);
}

function exerciseCountFor(duration: string | null): number {
  if (duration === "15_30") return 4;
  if (duration === "30_45") return 5;
  if (duration === "45_60") return 6;
  if (duration === "60_plus") return 7;
  return 5;
}

function splitFor(weeklySessions: string | null): DayFocus[] {
  // Array por day_index (0-6: seg-dom). "rest" pode aparecer mas nao gera.
  if (weeklySessions === "1_2") {
    return ["full_body", "core", "full_body", "core", "skill", "full_body", "core"];
  }
  if (weeklySessions === "3_4") {
    return ["push", "pull", "legs", "push", "pull", "legs", "skill"];
  }
  // 5_plus ou default
  return ["push", "pull", "legs", "push", "pull", "legs", "skill"];
}

const PATTERNS_FOR_FOCUS: Record<DayFocus, string[]> = {
  push: ["push_horizontal", "push_vertical"],
  pull: ["pull_horizontal", "pull_vertical"],
  legs: ["squat", "hinge"],
  full_body: [
    "push_horizontal",
    "pull_horizontal",
    "squat",
    "hinge",
    "core_antiext",
  ],
  skill: [
    "skill_handstand",
    "skill_planche",
    "skill_lever",
    "skill_balance",
  ],
  core: ["core_antiext", "core_antirot", "core_dyn"],
};

function setsRepsFor(
  ex: ExerciseMeta,
  fitnessLevel: number,
): { sets: number; reps: string; rest: string } {
  // Mobilidade/warmup: 1 serie longa
  if (
    ex.movement_pattern === "mobility" ||
    ex.movement_pattern === "warmup"
  ) {
    return { sets: 1, reps: "8-10 ciclos", rest: "—" };
  }
  // Cardio/plyo: mais series curtas
  if (ex.movement_pattern === "cardio" || ex.movement_pattern === "plyometric") {
    return { sets: 3, reps: "30s", rest: "45s" };
  }
  // Skills / isometria
  if (ex.time_based) {
    const hold = fitnessLevel <= 1 ? "20s" : "30s";
    return { sets: 3, reps: hold, rest: "60s" };
  }
  // Forca base por nivel
  if (fitnessLevel <= 0) return { sets: 3, reps: "8x", rest: "90s" };
  if (fitnessLevel === 1) return { sets: 3, reps: "10x", rest: "60s" };
  if (fitnessLevel === 2) return { sets: 4, reps: "10x", rest: "60s" };
  return { sets: 4, reps: "8x", rest: "45s" };
}

function filterBank(
  bank: ExerciseMeta[],
  profile: UserProfile,
  userLevel: number,
): ExerciseMeta[] {
  const userEquipment = new Set(profile.equipment);
  const limitations = new Set(
    (profile.physical_issues ?? []).filter((p) => p !== "none"),
  );

  return bank.filter((ex) => {
    if (ex.min_level > userLevel) return false;
    if (!ex.equipment.every((e) => userEquipment.has(e))) return false;
    if (ex.contraindications.some((c) => limitations.has(c))) return false;
    return true;
  });
}

function pickExercises(
  bank: ExerciseMeta[],
  focus: DayFocus,
  count: number,
  usedSlugs: Set<string>,
  skillFocus: string | null,
): ExerciseMeta[] {
  const patterns = PATTERNS_FOR_FOCUS[focus];
  const pool = bank.filter((ex) =>
    ex.movement_pattern ? patterns.includes(ex.movement_pattern) : false,
  );

  // Prioriza skill_focus do user se definido e o dia for "skill"
  const prioritySlugs = new Set<string>();
  if (focus === "skill" && skillFocus) {
    for (const ex of bank) {
      if (ex.skill_tag === skillFocus) prioritySlugs.add(ex.slug);
    }
  }

  const picked: ExerciseMeta[] = [];
  const sortedPool = [...pool].sort((a, b) => {
    const aPri = prioritySlugs.has(a.slug) ? 0 : 1;
    const bPri = prioritySlugs.has(b.slug) ? 0 : 1;
    if (aPri !== bPri) return aPri - bPri;
    return a.min_level - b.min_level;
  });

  // Pick diferente: prioriza nao-usados primeiro
  for (const ex of sortedPool) {
    if (picked.length >= count) break;
    if (usedSlugs.has(ex.slug)) continue;
    picked.push(ex);
  }
  // Se nao deu o count, completa permitindo repetir
  for (const ex of sortedPool) {
    if (picked.length >= count) break;
    if (picked.some((p) => p.slug === ex.slug)) continue;
    picked.push(ex);
  }

  picked.forEach((ex) => usedSlugs.add(ex.slug));
  return picked;
}

export function generatePlan(
  profile: UserProfile,
  bank: ExerciseMeta[],
  planDays: PlanDayLite[],
): GeneratedDay[] {
  const userLevel = maxLevelFor(profile);
  const filtered = filterBank(bank, profile, userLevel);
  const split = splitFor(profile.weekly_sessions);
  const exCount = exerciseCountFor(profile.workout_duration);
  const fitnessLevel = profile.fitness_level ?? 0;

  // Dias de treino ordenados por fase + day_index
  const treinoDias = planDays
    .filter((d) => d.type === "treino")
    .sort((a, b) => a.phase_id - b.phase_id || a.day_index - b.day_index);

  const usedSlugs = new Set<string>();
  const result: GeneratedDay[] = [];

  for (const day of treinoDias) {
    // Reseta anti-repeticao a cada 3 dias pra nao esgotar o banco
    if (day.day_index === 0) usedSlugs.clear();

    const focus = split[day.day_index % split.length];
    const picks = pickExercises(
      filtered,
      focus,
      exCount,
      usedSlugs,
      profile.skill_focus,
    );

    if (picks.length === 0) continue; // nao gera override vazio

    const exercises = picks.map((ex, i) => {
      const { sets, reps, rest } = setsRepsFor(ex, fitnessLevel);
      return {
        exercise_id: ex.id,
        position: i,
        sets,
        reps,
        rest,
      };
    });

    result.push({ plan_day_id: day.id, exercises });
  }

  return result;
}
