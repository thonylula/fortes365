"use client";

import { useMemo, useState, useTransition } from "react";
import { toggleExerciseDone } from "@/lib/supabase/mutations";
import { NavTabs } from "@/components/nav-tabs";
import { PaywallModal } from "@/components/paywall-modal";
import { AchievementToast } from "@/components/achievement-toast";
import { useRestTimer, RestTimerOverlay } from "@/components/rest-timer";
import { hapticSuccess, playSuccess, playComplete } from "@/lib/feedback";
import { levelByIndex, levelShort } from "@/lib/levels";

type AchievementInfo = { slug: string; title: string; emoji: string };

// ──────────────────────────────────────────────────────────────────────────
// Tipos
// ──────────────────────────────────────────────────────────────────────────
export type Month = {
  id: number;
  short_name: string;
  name: string;
  phase_label: string;
  phase_css_class: string;
  icon: string;
  level: number;
  has_bike: boolean;
  season: string;
};

export type PlanDay = {
  id: string;
  phase_id: number;
  day_index: number;
  type: "treino" | "caminhada" | "bike" | "mobilidade" | "descanso";
  focus: string | null;
  tip: string | null;
  cover_key: string | null;
  distance: string | null;
  zone: string | null;
  kcal_estimate: number | null;
  message: string | null;
  raw: {
    stretches?: { n: string; dur: string }[];
    phases?: string[];
  } | null;
  plan_day_exercises: PlanDayExercise[];
};

type PlanDayExercise = {
  position: number;
  sets: number | null;
  reps: string | null;
  rest: string | null;
  exercises: {
    slug: string;
    name: string;
    muscle_group: string | null;
    kcal_estimate: number | null;
    modifier: string | null;
    youtube_search_url: string | null;
  } | null;
};

// ──────────────────────────────────────────────────────────────────────────
// Constantes visuais (equivalentes às do forte365_v2.html)
// ──────────────────────────────────────────────────────────────────────────
const DAY_SHORT = ["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"];
const DAY_LONG = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

const COVER_GRADIENTS: Record<string, string> = {
  treino: "linear-gradient(135deg,#2a1a0e,#3d1f00)",
  bike: "linear-gradient(135deg,#0d1f3a,#0a2d6e)",
  caminhada: "linear-gradient(135deg,#0f2218,#0a3320)",
  mobilidade: "linear-gradient(135deg,#1a1a0e,#2a2a00)",
  descanso: "linear-gradient(135deg,#0e1a1a,#0a2a25)",
};

const DAY_TYPE_LABEL: Record<PlanDay["type"], string> = {
  treino: "Treino",
  caminhada: "Caminhada",
  bike: "Bike",
  mobilidade: "Mobilidade",
  descanso: "Descanso",
};

// ──────────────────────────────────────────────────────────────────────────
// Componente
// ──────────────────────────────────────────────────────────────────────────
type UserInfo = { email: string; name?: string } | null;

export function PlanExplorer({
  months,
  days,
  weekVolume,
  user,
  initialCompleted,
  isPremium,
  freeMonths,
}: {
  months: Month[];
  days: PlanDay[];
  weekVolume: number[];
  user: UserInfo;
  initialCompleted?: string[];
  isPremium?: boolean;
  freeMonths?: number[];
}) {
  const [monthId, setMonthId] = useState(0);
  const [weekIndex, setWeekIndex] = useState(0);
  const [dayIndex, setDayIndex] = useState(0);
  const [completedSlugs, setCompletedSlugs] = useState<Set<string>>(
    () => new Set(initialCompleted ?? []),
  );
  const [showPaywall, setShowPaywall] = useState(false);
  const [pendingAchievements, setPendingAchievements] = useState<AchievementInfo[]>([]);
  const restTimer = useRestTimer();

  const handleNewAchievements = (achievements: AchievementInfo[]) => {
    if (achievements.length > 0) {
      setPendingAchievements(achievements);
    }
  };

  const allowedMonths = new Set(freeMonths ?? [0]);
  const isMonthLocked = !isPremium && !allowedMonths.has(monthId);

  // Agrupa dias por phase_id para lookup O(1).
  const daysByPhase = useMemo(() => {
    const map = new Map<number, PlanDay[]>();
    for (const d of days) {
      if (!map.has(d.phase_id)) map.set(d.phase_id, []);
      map.get(d.phase_id)!.push(d);
    }
    for (const arr of map.values()) arr.sort((a, b) => a.day_index - b.day_index);
    return map;
  }, [days]);

  const month = months.find((m) => m.id === monthId) ?? months[0];
  const phaseDays = daysByPhase.get(month.level) ?? [];
  const day = phaseDays.find((d) => d.day_index === dayIndex) ?? phaseDays[0];
  const volumeMultiplier = weekVolume[weekIndex] ?? 1;

  return (
    <div className="flex min-h-screen flex-col bg-[color:var(--bg)]">
      <Header user={user} />
      <NavTabs />

      {/* Level strip (substitui o antigo strip de meses; data continua mes 0-11) */}
      <div className="border-b border-[color:var(--bd)] bg-[color:var(--s2)] px-3 py-2 overflow-x-auto">
        <div className="mb-1 flex items-center gap-2 text-[10px] uppercase tracking-[1.5px] text-[color:var(--tx3)]">
          <span>Nível</span>
          <span className="text-[color:var(--or)]">{levelByIndex(monthId).name}</span>
          <span className="text-[color:var(--tx3)]">· {levelByIndex(monthId).subtitle}</span>
        </div>
        <div className="flex min-w-max gap-[5px]">
          {months.map((m) => {
            const locked = !isPremium && !allowedMonths.has(m.id);
            return (
              <button
                key={m.id}
                className="chipbtn"
                data-active={m.id === monthId}
                onClick={() => {
                  if (locked) {
                    setShowPaywall(true);
                    return;
                  }
                  setMonthId(m.id);
                  setWeekIndex(0);
                }}
                style={locked ? { opacity: 0.5 } : undefined}
                title={`Nível ${m.id + 1} — ${levelByIndex(m.id).name}`}
              >
                {locked ? "🔒 " : ""}{levelShort(m.id)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Week strip + phase chip */}
      <div className="flex items-center gap-3 overflow-x-auto border-b border-[color:var(--bd)] bg-[color:var(--bg)] px-3 py-2">
        <span className="shrink-0 text-[10px] uppercase tracking-[1.5px] text-[color:var(--tx3)]">
          Semana:
        </span>
        <div className="flex shrink-0 gap-[5px]">
          {[0, 1, 2, 3].map((w) => (
            <button
              key={w}
              className="chipbtn"
              data-active={w === weekIndex}
              onClick={() => setWeekIndex(w)}
            >
              Sem {w + 1}
            </button>
          ))}
        </div>
        <span className={`pchip ${month.phase_css_class} shrink-0`}>
          {month.phase_label} · {month.season}
        </span>
      </div>

      {/* Day strip */}
      <div className="border-b border-[color:var(--bd)] bg-[color:var(--s1)] px-3 py-2 overflow-x-auto">
        <div className="flex min-w-max gap-[5px]">
          {DAY_SHORT.map((label, i) => {
            const phaseDay = phaseDays.find((d) => d.day_index === i);
            const isTraining = phaseDay?.type === "treino";
            return (
              <button
                key={i}
                className="daybtn"
                data-active={i === dayIndex}
                onClick={() => setDayIndex(i)}
              >
                <span className="da">{label}</span>
                <span className="dn">{isTraining ? "16h" : "—"}</span>
              </button>
            );
          })}
        </div>
      </div>

      {showPaywall && (
        <PaywallModal isLoggedIn={!!user} onClose={() => setShowPaywall(false)} />
      )}

      {pendingAchievements.length > 0 && (
        <AchievementToast
          achievements={pendingAchievements}
          onDone={() => setPendingAchievements([])}
        />
      )}

      <RestTimerOverlay
        isActive={restTimer.isActive}
        isFinished={restTimer.isFinished}
        remaining={restTimer.remaining}
        duration={restTimer.duration}
        exercise={restTimer.exercise}
        onCancel={restTimer.cancel}
      />

      {/* Main content */}
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-5 pb-20">
        {day && (
          <div key={`${monthId}-${weekIndex}-${dayIndex}`} className="animate-in">
            <DayView
              day={day}
              volumeMultiplier={volumeMultiplier}
              monthId={monthId}
              weekIndex={weekIndex}
              isLoggedIn={!!user}
              completedSlugs={completedSlugs}
              onToggle={(slug) => {
                setCompletedSlugs((prev) => {
                  const next = new Set(prev);
                  if (next.has(slug)) next.delete(slug);
                  else next.add(slug);
                  return next;
                });
              }}
              onAchievement={handleNewAchievements}
              onStartRest={restTimer.start}
            />
          </div>
        )}
      </main>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Header
// ──────────────────────────────────────────────────────────────────────────
function Header({ user }: { user: UserInfo }) {
  const initial = user
    ? (user.name ?? user.email).charAt(0).toUpperCase()
    : null;

  return (
    <header className="sticky top-0 z-20 flex h-[52px] items-center justify-between border-b border-[color:var(--bd)] bg-[color:var(--s1)] px-4">
      <a href="/" className="logo">
        FORT<span>E</span>
        <sub>365</sub>
      </a>
      <div className="flex items-center gap-2">
        {user ? (
          <a
            href="/conta"
            className="flex items-center gap-2 rounded-md border border-[color:var(--or)] bg-[color:var(--ord)] px-2.5 py-1 transition-colors hover:bg-[color:var(--or)] hover:text-black"
          >
            <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-[color:var(--ord)] font-[family-name:var(--font-display)] text-[9px] text-[color:var(--or)]">
              {initial}
            </span>
            <span className="text-[11px] font-semibold">
              {user.name ?? user.email.split("@")[0]}
            </span>
          </a>
        ) : (
          <a
            href="/login"
            className="rounded-md border border-[color:var(--or)] bg-[color:var(--ord)] px-3 py-1.5 font-[family-name:var(--font-condensed)] text-[11px] font-bold uppercase tracking-wider text-[color:var(--or)] transition-colors hover:bg-[color:var(--or)] hover:text-black"
          >
            Entrar
          </a>
        )}
      </div>
    </header>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// DayView — roteador por tipo de dia
// ──────────────────────────────────────────────────────────────────────────
type DayCtx = {
  day: PlanDay;
  volumeMultiplier: number;
  monthId: number;
  weekIndex: number;
  isLoggedIn: boolean;
  completedSlugs: Set<string>;
  onToggle: (slug: string) => void;
  onAchievement: (achievements: AchievementInfo[]) => void;
  onStartRest: (rest: string, name: string) => void;
};

function DayView(ctx: DayCtx) {
  const { day } = ctx;
  return (
    <div className="space-y-4">
      <Cover day={day} />
      {day.type === "treino" && <TreinoBlock {...ctx} />}
      {(day.type === "caminhada" || day.type === "bike") && <CardioBlock day={day} />}
      {day.type === "mobilidade" && <MobilidadeBlock day={day} />}
      {day.type === "descanso" && <DescansoBlock day={day} />}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Cover
// ──────────────────────────────────────────────────────────────────────────
function Cover({ day }: { day: PlanDay }) {
  const gradient = COVER_GRADIENTS[day.cover_key ?? day.type] ?? COVER_GRADIENTS.treino;
  const title = day.focus ?? DAY_TYPE_LABEL[day.type];
  const subtitle =
    day.type === "treino"
      ? `${DAY_LONG[day.day_index]} · Treino`
      : day.distance
        ? `${DAY_LONG[day.day_index]} · ${day.distance}`
        : DAY_LONG[day.day_index];

  return (
    <div className="cover-wrap" style={{ background: gradient }}>
      <div className="cover-overlay" />
      <div className="cover-content">
        <div className="cover-title">{title}</div>
        <div className="cover-sub">{subtitle}</div>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          <span
            className="rounded-sm px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
            style={{ background: "var(--or)", color: "#fff" }}
          >
            {DAY_TYPE_LABEL[day.type]}
          </span>
          {day.zone && (
            <span
              className="rounded-sm px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
              style={{ background: "var(--bl)", color: "#fff" }}
            >
              {day.zone}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Treino: kcal summary + exercise list + tip
// ──────────────────────────────────────────────────────────────────────────
function TreinoBlock(ctx: DayCtx) {
  const { day, volumeMultiplier, monthId, weekIndex, isLoggedIn, completedSlugs, onToggle, onAchievement, onStartRest } = ctx;
  const exercises = [...day.plan_day_exercises].sort((a, b) => a.position - b.position);
  const totalKcal = Math.round(
    exercises.reduce((sum, ex) => sum + (ex.exercises?.kcal_estimate ?? 0), 0) * volumeMultiplier,
  );
  const totalSets = exercises.reduce((sum, ex) => sum + (ex.sets ?? 0), 0);
  const doneCount = exercises.filter((ex) => ex.exercises && completedSlugs.has(ex.exercises.slug)).length;
  const allDone = doneCount === exercises.length && doneCount > 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-[7px]">
        <div className="ks-box">
          <div className="ks-v">{exercises.length}</div>
          <div className="ks-l">Exercícios</div>
        </div>
        <div className="ks-box">
          <div className="ks-v">{totalSets}</div>
          <div className="ks-l">Séries</div>
        </div>
        <div className="ks-box">
          <div className="ks-v" style={{ color: "var(--or)" }}>
            {totalKcal}
          </div>
          <div className="ks-l">Kcal est.</div>
        </div>
        <div className="ks-box">
          <div className="ks-v" style={{ color: doneCount === exercises.length && doneCount > 0 ? "var(--gn)" : "var(--bl)" }}>
            {doneCount}/{exercises.length}
          </div>
          <div className="ks-l">Feitos</div>
        </div>
      </div>

      {day.tip && (
        <div className="tip-box">
          <div className="tip-box-t">Dica do dia</div>
          <div className="tip-box-c">{day.tip}</div>
        </div>
      )}

      <div>
        <div className="slbl mb-2.5">Exercícios</div>
        <div className="flex flex-col gap-[7px]">
          {exercises.map((ex, i) => (
            <ExerciseCard
              key={ex.position}
              ex={ex}
              index={i}
              planDayId={day.id}
              monthId={monthId}
              weekIndex={weekIndex}
              dayIndex={day.day_index}
              isLoggedIn={isLoggedIn}
              isDone={!!ex.exercises && completedSlugs.has(ex.exercises.slug)}
              onToggle={onToggle}
              onAchievement={onAchievement}
              onStartRest={onStartRest}
            />
          ))}
        </div>

        {allDone && (
          <div className="animate-in mt-4 rounded-xl border border-[color:var(--gn)] bg-[color:var(--gnd)] p-4 text-center">
            <div className="mb-1 text-2xl">🎉</div>
            <div className="font-[family-name:var(--font-display)] text-lg tracking-wider text-[color:var(--gn)]">
              TREINO COMPLETO
            </div>
            <p className="mt-1 text-xs text-[color:var(--tx2)]">
              Todos os {exercises.length} exercicios concluidos. Descanse bem!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function ExerciseCard({
  ex,
  index,
  planDayId,
  monthId,
  weekIndex,
  dayIndex,
  isLoggedIn,
  isDone,
  onToggle,
  onAchievement,
  onStartRest,
}: {
  ex: PlanDayExercise;
  index: number;
  planDayId: string;
  monthId: number;
  weekIndex: number;
  dayIndex: number;
  isLoggedIn: boolean;
  isDone: boolean;
  onToggle: (slug: string) => void;
  onAchievement: (achievements: AchievementInfo[]) => void;
  onStartRest: (rest: string, name: string) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [showVideo, setShowVideo] = useState(false);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const e = ex.exercises;
  if (!e) return null;

  const handleToggle = () => {
    const wasNotDone = !isDone;
    onToggle(e.slug);
    if (wasNotDone) {
      hapticSuccess();
      playSuccess();
      if (ex.rest) onStartRest(ex.rest, e.name);
    }
    startTransition(async () => {
      const fd = new FormData();
      fd.set("planDayId", planDayId);
      fd.set("exerciseSlug", e.slug);
      fd.set("monthId", String(monthId));
      fd.set("weekIndex", String(weekIndex));
      fd.set("dayIndex", String(dayIndex));
      fd.set("sets", String(ex.sets ?? 1));
      fd.set("reps", ex.reps ?? "");
      fd.set("isDone", String(isDone));
      const result = await toggleExerciseDone(fd);
      if (result?.newAchievements?.length) {
        onAchievement(result.newAchievements);
      }
    });
  };

  const handleShowVideo = async () => {
    if (showVideo) { setShowVideo(false); return; }
    setShowVideo(true);
    if (videoId) return;
    setVideoLoading(true);
    try {
      const cacheKey = `yt4_${e.slug}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) { setVideoId(cached); setVideoLoading(false); return; }
      const res = await fetch(`/api/youtube-search?q=${encodeURIComponent(e.name)}&slug=${encodeURIComponent(e.slug)}`);
      const data = await res.json();
      if (data.videoId) {
        setVideoId(data.videoId);
        localStorage.setItem(cacheKey, data.videoId);
      }
    } catch { /* fallback: no video */ }
    setVideoLoading(false);
  };

  return (
    <div
      className="overflow-hidden rounded-xl border-[1.5px] border-[color:var(--bd)] bg-[color:var(--s1)] transition-all"
      style={isDone ? { borderColor: "var(--gn)", background: "rgba(34,197,94,.06)" } : undefined}
    >
      <div className="flex gap-[0.7rem] p-[0.9rem]">
        <div className="ex-num" style={isDone ? { color: "var(--gn)" } : undefined}>
          {isDone ? "✓" : String(index + 1).padStart(2, "0")}
        </div>
        <div className="flex-1">
          <div className="ex-name">{e.name}</div>
          {e.muscle_group && <div className="ex-muscle">{e.muscle_group}</div>}
          <div className="flex flex-wrap gap-[5px]">
            {ex.sets != null && <span className="et ts">{ex.sets} series</span>}
            {ex.reps && <span className="et tr">{ex.reps}</span>}
            {ex.rest && <span className="et td">desc {ex.rest}</span>}
            {e.kcal_estimate != null && <span className="et tk">~{e.kcal_estimate} kcal</span>}
          </div>
          {e.modifier && <div className="ex-mod">{e.modifier}</div>}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          {e.youtube_search_url && (
            <button onClick={handleShowVideo} className="yt-btn">
              {showVideo ? "✕ Fechar" : "▶ Ver"}
            </button>
          )}
          {isLoggedIn && (
            <button
              onClick={handleToggle}
              disabled={isPending}
              className="flex items-center gap-1 rounded-md px-2 py-1 font-[family-name:var(--font-condensed)] text-[10px] font-bold uppercase tracking-wider transition-colors"
              style={
                isDone
                  ? { background: "var(--gnd)", border: "1.5px solid var(--gn)", color: "var(--gn)" }
                  : { background: "none", border: "1.5px solid var(--bd)", color: "var(--tx2)" }
              }
            >
              {isPending ? (
                <svg className="h-3 w-3 animate-[spin_0.6s_linear_infinite]" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="50 20" />
                </svg>
              ) : isDone ? "✓ Feito" : "Concluir"}
            </button>
          )}
        </div>
      </div>

      {/* Video inline */}
      {showVideo && (
        <div className="animate-in border-t border-[color:var(--bd)] bg-black">
          {videoLoading && (
            <div className="flex items-center justify-center py-8">
              <svg className="h-6 w-6 animate-[spin_0.6s_linear_infinite] text-[color:var(--or)]" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="50 20" />
              </svg>
              <span className="ml-2 text-xs text-[color:var(--tx3)]">Buscando video...</span>
            </div>
          )}
          {videoId && (
            <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`}
                className="absolute inset-0 h-full w-full"
                allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                loading="lazy"
                title={`Video: ${e.name}`}
              />
            </div>
          )}
          {!videoLoading && !videoId && (
            <div className="flex flex-col items-center gap-2 py-6">
              <span className="text-xs text-[color:var(--tx3)]">Video nao encontrado</span>
              <a href={e.youtube_search_url!} target="_blank" rel="noopener noreferrer" className="yt-btn">
                Buscar no YouTube ↗
              </a>
            </div>
          )}
        </div>
      )}

      {/* Set logger — aparece quando exercicio esta feito */}
      {isDone && ex.sets != null && ex.sets > 0 && (
        <SetLogger slug={e.slug} sets={ex.sets} targetReps={ex.reps ?? ""} monthId={monthId} weekIndex={weekIndex} dayIndex={dayIndex} />
      )}
    </div>
  );
}

const SET_LOG_KEY = "forte_set_logs";
type SetLog = { reps: string; rpe: string };

function loadSetLogs(key: string): SetLog[] {
  try {
    const raw = localStorage.getItem(SET_LOG_KEY);
    if (!raw) return [];
    const all = JSON.parse(raw) as Record<string, SetLog[]>;
    return all[key] ?? [];
  } catch { return []; }
}

function saveSetLogs(key: string, logs: SetLog[]) {
  try {
    const raw = localStorage.getItem(SET_LOG_KEY);
    const all = raw ? JSON.parse(raw) as Record<string, SetLog[]> : {};
    all[key] = logs;
    localStorage.setItem(SET_LOG_KEY, JSON.stringify(all));
  } catch { /* noop */ }
}

function SetLogger({ slug, sets, targetReps, monthId, weekIndex, dayIndex }: {
  slug: string; sets: number; targetReps: string; monthId: number; weekIndex: number; dayIndex: number;
}) {
  const logKey = `${monthId}_${weekIndex}_${dayIndex}_${slug}`;
  const [logs, setLogs] = useState<SetLog[]>(() => {
    const saved = loadSetLogs(logKey);
    if (saved.length === sets) return saved;
    return Array.from({ length: sets }, (_, i) => saved[i] ?? { reps: "", rpe: "" });
  });

  const update = (i: number, field: "reps" | "rpe", value: string) => {
    const cleaned = value.replace(/[^0-9]/g, "");
    const next = [...logs];
    next[i] = { ...next[i], [field]: cleaned };
    setLogs(next);
    saveSetLogs(logKey, next);
  };

  return (
    <div className="animate-in border-t border-[color:var(--bd)] bg-[color:var(--s2)] px-[0.9rem] py-2">
      <div className="mb-1.5 flex items-center gap-2">
        <span className="font-[family-name:var(--font-condensed)] text-[9px] font-bold uppercase tracking-[1.5px] text-[color:var(--tx3)]">
          Registro de series
        </span>
        {targetReps && (
          <span className="text-[9px] text-[color:var(--or)]">meta: {targetReps}</span>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {logs.map((log, i) => (
          <div key={i} className="flex items-center gap-1 rounded-lg bg-[color:var(--s1)] px-2 py-1.5">
            <span className="font-[family-name:var(--font-condensed)] text-[9px] font-bold text-[color:var(--tx3)]">S{i + 1}</span>
            <input
              type="text"
              inputMode="numeric"
              placeholder="reps"
              value={log.reps}
              onChange={(e) => update(i, "reps", e.target.value)}
              className="w-10 bg-transparent text-center text-[12px] font-bold text-[color:var(--tx)] outline-none placeholder:text-[color:var(--tx3)]"
            />
            <span className="text-[8px] text-[color:var(--tx3)]">RPE</span>
            <input
              type="text"
              inputMode="numeric"
              placeholder="—"
              value={log.rpe}
              onChange={(e) => update(i, "rpe", e.target.value)}
              className="w-6 bg-transparent text-center text-[11px] text-[color:var(--or)] outline-none placeholder:text-[color:var(--tx3)]"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Cardio (caminhada + bike)
// ──────────────────────────────────────────────────────────────────────────
function CardioBlock({ day }: { day: PlanDay }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-[7px]">
        <div className="ks-box">
          <div className="ks-v">{day.distance ?? "—"}</div>
          <div className="ks-l">Duração</div>
        </div>
        <div className="ks-box">
          <div className="ks-v" style={{ color: "var(--or)" }}>
            {day.kcal_estimate ?? "—"}
          </div>
          <div className="ks-l">Kcal est.</div>
        </div>
        <div className="ks-box">
          <div className="ks-v text-[12px]" style={{ color: "var(--bl)" }}>
            {day.zone ?? "—"}
          </div>
          <div className="ks-l">Zona</div>
        </div>
      </div>

      {day.tip && (
        <div className="tip-box">
          <div className="tip-box-t">Dica</div>
          <div className="tip-box-c">{day.tip}</div>
        </div>
      )}

      {day.raw?.phases && day.raw.phases.length > 0 && (
        <div>
          <div className="slbl mb-2.5">Sessão</div>
          <div className="flex flex-col gap-[5px]">
            {day.raw.phases.map((p, i) => (
              <div
                key={i}
                className="rounded-lg bg-[color:var(--s2)] px-3 py-2 text-[12px] text-[color:var(--tx2)]"
                style={{
                  borderLeft: `3px solid ${day.type === "bike" ? "var(--bl)" : "var(--gn)"}`,
                }}
              >
                {p}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Mobilidade
// ──────────────────────────────────────────────────────────────────────────
function MobilidadeBlock({ day }: { day: PlanDay }) {
  const stretches = day.raw?.stretches ?? [];
  return (
    <div className="space-y-4">
      <div className="ks-box">
        <div className="ks-v">{day.distance ?? "20 min"}</div>
        <div className="ks-l">Sessão de mobilidade</div>
      </div>
      <div>
        <div className="slbl mb-2.5">Alongamentos</div>
        <div className="flex flex-col gap-[7px]">
          {stretches.map((s, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg bg-[color:var(--s2)] px-3 py-2 text-[12px]"
              style={{ borderLeft: "3px solid var(--yw)" }}
            >
              <span className="font-semibold">{s.n}</span>
              <span className="font-[family-name:var(--font-condensed)] text-[10px] font-bold text-[color:var(--yw)]">
                {s.dur}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Descanso
// ──────────────────────────────────────────────────────────────────────────
function DescansoBlock({ day }: { day: PlanDay }) {
  return (
    <div
      className="rounded-xl border p-8 text-center"
      style={{ borderColor: "var(--gn)", background: "var(--s1)" }}
    >
      <div className="mb-3 text-5xl">🛌</div>
      <div className="font-[family-name:var(--font-display)] text-2xl tracking-widest">
        DESCANSO
      </div>
      <p className="mt-3 text-[13px] text-[color:var(--tx2)] leading-relaxed">
        {day.message ?? "Descanso total. Hidrate-se e durma bem."}
      </p>
    </div>
  );
}
