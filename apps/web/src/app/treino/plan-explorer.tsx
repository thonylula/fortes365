"use client";

import { useMemo, useState } from "react";

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
export function PlanExplorer({
  months,
  days,
  weekVolume,
}: {
  months: Month[];
  days: PlanDay[];
  weekVolume: number[];
}) {
  const [monthId, setMonthId] = useState(0);
  const [weekIndex, setWeekIndex] = useState(0);
  const [dayIndex, setDayIndex] = useState(0);

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
      <Header />

      {/* Month strip */}
      <div className="border-b border-[color:var(--bd)] bg-[color:var(--s2)] px-3 py-2 overflow-x-auto">
        <div className="flex min-w-max gap-[5px]">
          {months.map((m) => (
            <button
              key={m.id}
              className="chipbtn"
              data-active={m.id === monthId}
              onClick={() => {
                setMonthId(m.id);
                setWeekIndex(0);
              }}
            >
              {m.short_name}
            </button>
          ))}
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
          {month.name} · {month.phase_label} · {month.season}
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

      {/* Main content */}
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-5 pb-20">
        {day && <DayView day={day} volumeMultiplier={volumeMultiplier} />}
      </main>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Header
// ──────────────────────────────────────────────────────────────────────────
function Header() {
  return (
    <header className="sticky top-0 z-20 flex h-[52px] items-center justify-between border-b border-[color:var(--bd)] bg-[color:var(--s1)] px-4">
      <div className="logo">
        FORT<span>E</span>
        <sub>365</sub>
      </div>
      <div className="flex gap-[5px]">
        <PlayerBadge initials="LL" name="Luanthony" variant="or" />
        <PlayerBadge initials="JO" name="Jéssica" variant="pk" />
      </div>
    </header>
  );
}

function PlayerBadge({
  initials,
  name,
  variant,
}: {
  initials: string;
  name: string;
  variant: "or" | "pk";
}) {
  const borderColor = variant === "or" ? "var(--or)" : "var(--pk)";
  const bg = variant === "or" ? "var(--ord)" : "var(--pkd)";
  const fg = variant === "or" ? "var(--or)" : "var(--pk)";
  return (
    <div
      className="flex items-center gap-[5px] rounded-md px-2 py-1"
      style={{ border: `1.5px solid ${borderColor}`, background: bg }}
    >
      <div
        className="flex h-[22px] w-[22px] items-center justify-center rounded-full font-[family-name:var(--font-display)] text-[9px]"
        style={{ background: bg, color: fg }}
      >
        {initials}
      </div>
      <span className="text-[11px] font-semibold">{name}</span>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// DayView — roteador por tipo de dia
// ──────────────────────────────────────────────────────────────────────────
function DayView({ day, volumeMultiplier }: { day: PlanDay; volumeMultiplier: number }) {
  return (
    <div className="space-y-4">
      <Cover day={day} />
      {day.type === "treino" && <TreinoBlock day={day} volumeMultiplier={volumeMultiplier} />}
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
function TreinoBlock({ day, volumeMultiplier }: { day: PlanDay; volumeMultiplier: number }) {
  const exercises = [...day.plan_day_exercises].sort((a, b) => a.position - b.position);
  const totalKcal = Math.round(
    exercises.reduce((sum, ex) => sum + (ex.exercises?.kcal_estimate ?? 0), 0) * volumeMultiplier,
  );
  const totalSets = exercises.reduce((sum, ex) => sum + (ex.sets ?? 0), 0);

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
          <div className="ks-v" style={{ color: "var(--bl)" }}>
            {volumeMultiplier.toFixed(2)}×
          </div>
          <div className="ks-l">Volume</div>
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
            <ExerciseCard key={ex.position} ex={ex} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ExerciseCard({ ex, index }: { ex: PlanDayExercise; index: number }) {
  const e = ex.exercises;
  if (!e) return null;
  return (
    <div className="ex-card">
      <div className="ex-num">{String(index + 1).padStart(2, "0")}</div>
      <div className="flex-1">
        <div className="ex-name">{e.name}</div>
        {e.muscle_group && <div className="ex-muscle">{e.muscle_group}</div>}
        <div className="flex flex-wrap gap-[5px]">
          {ex.sets != null && <span className="et ts">{ex.sets} séries</span>}
          {ex.reps && <span className="et tr">{ex.reps}</span>}
          {ex.rest && <span className="et td">desc {ex.rest}</span>}
          {e.kcal_estimate != null && <span className="et tk">~{e.kcal_estimate} kcal</span>}
        </div>
        {e.modifier && <div className="ex-mod">{e.modifier}</div>}
      </div>
      {e.youtube_search_url && (
        <a
          href={e.youtube_search_url}
          target="_blank"
          rel="noopener noreferrer"
          className="yt-btn shrink-0"
        >
          ▶ YouTube
        </a>
      )}
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
