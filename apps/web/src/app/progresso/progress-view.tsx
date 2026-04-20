"use client";

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { WeeklyChallenges } from "@/components/weekly-challenges";
import { LEVELS, levelByIndex } from "@/lib/levels";
import type { WorkoutRow, HealthRow } from "./page";

type Props = {
  progress: {
    total_xp: number;
    current_streak: number;
    longest_streak: number;
    last_workout_at: string | null;
    current_month: number;
    current_week: number;
  } | null;
  profile: {
    display_name: string | null;
    fitness_level: number | null;
    weight_kg: number | null;
    height_cm: number | null;
  } | null;
  workouts: WorkoutRow[];
  achievementCount: number;
  skillStats: { total: number; mastered: number };
  memberSince: string;
  dailyHealth: HealthRow[];
};

const FITNESS_LABELS = ["Iniciante", "Basico", "Intermediario", "Avancado"];

function getWeekLabel(date: Date) {
  const start = new Date(date.getFullYear(), 0, 1);
  const week = Math.ceil(((date.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7);
  return `S${week}`;
}

export function ProgressView({ progress, profile, workouts, achievementCount, skillStats, memberSince, dailyHealth }: Props) {
  const daysSinceJoin = Math.max(1, Math.floor((Date.now() - new Date(memberSince).getTime()) / 86400000));

  const weeklyData = useMemo(() => {
    const map = new Map<string, number>();
    for (const w of workouts) {
      const d = new Date(w.started_at);
      const key = getWeekLabel(d);
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    const entries = [...map.entries()].slice(0, 12).reverse();
    return entries.map(([week, count]) => ({ week, treinos: count }));
  }, [workouts]);

  const levelData = useMemo(() => {
    // Conta treinos por nivel (mapeia mes calendario -> nivel via current_month)
    // Aproximacao: distribui treinos historicamente entre os 12 niveis
    const map = new Map<number, number>();
    for (const w of workouts) {
      const m = new Date(w.started_at).getMonth();
      map.set(m, (map.get(m) ?? 0) + 1);
    }
    return LEVELS.map((lv) => ({
      nivel: lv.short,
      treinos: map.get(lv.n - 1) ?? 0,
    }));
  }, [workouts]);

  const bmi = profile?.weight_kg && profile?.height_cm
    ? profile.weight_kg / ((profile.height_cm / 100) ** 2)
    : null;

  const avgPerWeek = workouts.length > 0 ? (workouts.length / Math.max(1, daysSinceJoin / 7)).toFixed(1) : "0";

  const todayIso = new Date().toISOString().slice(0, 10);
  const today = dailyHealth.find((h) => h.date === todayIso) ?? null;
  const stepsChartData = useMemo(
    () =>
      dailyHealth.map((h) => ({
        date: h.date.slice(5), // MM-DD
        passos: h.steps ?? 0,
      })),
    [dailyHealth],
  );

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 pb-20" id="main-content">
      <h1 className="mb-6 text-center font-[family-name:var(--font-display)] text-3xl tracking-wider">
        PROGRESSO
      </h1>

      <WeeklyChallenges />

      {/* Stats grid */}
      <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatCard value={progress?.total_xp ?? 0} label="XP Total" color="var(--or)" />
        <StatCard value={progress?.current_streak ?? 0} label="Streak Atual" color="var(--or)" />
        <StatCard value={progress?.longest_streak ?? 0} label="Maior Streak" color="var(--gn)" />
        <StatCard value={workouts.length} label="Treinos Totais" color="var(--bl)" />
      </div>

      {/* Secondary stats */}
      <div className="mb-6 grid grid-cols-3 gap-2">
        <MiniStat label="Media/semana" value={avgPerWeek} />
        <MiniStat label="Conquistas" value={String(achievementCount)} />
        <MiniStat label="Skills" value={`${skillStats.mastered}/${skillStats.total}`} />
      </div>

      {/* Google Fit - Hoje */}
      {dailyHealth.length > 0 && (
        <div className="mb-6 rounded-xl border border-[color:var(--bd)] bg-[color:var(--s1)] p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="slbl">Hoje · Google Fit</div>
            <span className="text-[9px] uppercase tracking-wider text-[color:var(--tx3)]">
              {today ? "sincronizado" : "sem dados hoje"}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <HealthKpi value={today?.steps ?? null} label="Passos" color="var(--or)" />
            <HealthKpi value={today?.active_kcal ?? null} label="kcal ativas" color="var(--or)" />
            <HealthKpi value={today?.resting_hr ?? null} label="FC repouso" color="var(--bl)" suffix="bpm" />
          </div>
        </div>
      )}

      {/* Chart passos 14 dias */}
      {stepsChartData.length > 0 && (
        <div className="mb-6 rounded-xl border border-[color:var(--bd)] bg-[color:var(--s1)] p-4">
          <div className="slbl mb-3">Passos · 14 dias</div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={stepsChartData}>
              <XAxis dataKey="date" tick={{ fill: "#555", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis hide allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: "#141414", border: "1px solid #2e2e2e", borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: "#999" }}
                cursor={{ fill: "rgba(255,85,0,0.08)" }}
              />
              <Bar dataKey="passos" fill="#ff5500" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Fitness level + BMI */}
      <div className="mb-6 grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-[color:var(--bd)] bg-[color:var(--s1)] p-4">
          <div className="mb-1 font-[family-name:var(--font-condensed)] text-[9px] font-bold uppercase tracking-[1.5px] text-[color:var(--tx3)]">
            Nivel fitness
          </div>
          <div className="font-[family-name:var(--font-display)] text-xl tracking-wider" style={{ color: "var(--or)" }}>
            {FITNESS_LABELS[profile?.fitness_level ?? 0]}
          </div>
          <div className="mt-1 flex gap-1">
            {[0, 1, 2, 3].map((l) => (
              <div
                key={l}
                className="h-1.5 flex-1 rounded-full"
                style={{ background: l <= (profile?.fitness_level ?? 0) ? "var(--or)" : "var(--s2)" }}
              />
            ))}
          </div>
        </div>
        {bmi != null && (
          <div className="rounded-xl border border-[color:var(--bd)] bg-[color:var(--s1)] p-4">
            <div className="mb-1 font-[family-name:var(--font-condensed)] text-[9px] font-bold uppercase tracking-[1.5px] text-[color:var(--tx3)]">
              IMC
            </div>
            <div className="font-[family-name:var(--font-display)] text-xl tracking-wider" style={{ color: bmi < 25 ? "var(--gn)" : bmi < 30 ? "var(--or)" : "var(--pk)" }}>
              {bmi.toFixed(1)}
            </div>
            <div className="mt-1 text-[10px] text-[color:var(--tx3)]">
              {bmi < 18.5 ? "Abaixo do peso" : bmi < 25 ? "Normal" : bmi < 30 ? "Sobrepeso" : "Obesidade"}
            </div>
          </div>
        )}
      </div>

      {/* Treinos por semana (bar chart) */}
      {weeklyData.length > 0 && (
        <div className="mb-6 rounded-xl border border-[color:var(--bd)] bg-[color:var(--s1)] p-4">
          <div className="slbl mb-3">Treinos por semana</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={weeklyData}>
              <XAxis dataKey="week" tick={{ fill: "#555", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis hide allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: "#141414", border: "1px solid #2e2e2e", borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: "#999" }}
                cursor={{ fill: "rgba(255,85,0,0.08)" }}
              />
              <Bar dataKey="treinos" fill="#ff5500" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Treinos por nivel (area chart) */}
      <div className="mb-6 rounded-xl border border-[color:var(--bd)] bg-[color:var(--s1)] p-4">
        <div className="slbl mb-3">Treinos por nivel</div>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={levelData}>
            <defs>
              <linearGradient id="gradOrange" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ff5500" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#ff5500" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="nivel" tick={{ fill: "#555", fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis hide allowDecimals={false} />
            <Tooltip
              contentStyle={{ background: "#141414", border: "1px solid #2e2e2e", borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: "#999" }}
              cursor={{ stroke: "rgba(255,85,0,0.3)" }}
            />
            <Area type="monotone" dataKey="treinos" stroke="#ff5500" strokeWidth={2} fill="url(#gradOrange)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Posicao no plano */}
      {progress && (
        <div className="rounded-xl border border-[color:var(--bd)] bg-[color:var(--s1)] p-4">
          <div className="slbl mb-3">Posicao no programa</div>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="mb-1 flex justify-between text-[10px] text-[color:var(--tx3)]">
                <span>Nivel {progress.current_month + 1} de 12</span>
                <span>{Math.round(((progress.current_month + 1) / 12) * 100)}%</span>
              </div>
              <div className="h-2 rounded-full bg-[color:var(--s2)]">
                <div
                  className="h-2 rounded-full transition-all"
                  style={{ width: `${((progress.current_month + 1) / 12) * 100}%`, background: "linear-gradient(90deg, var(--or), #ff9944)" }}
                />
              </div>
            </div>
          </div>
          <div className="mt-3 flex gap-4 text-center">
            <div>
              <div className="font-[family-name:var(--font-display)] text-lg tracking-wider" style={{ color: "var(--or)" }}>
                {levelByIndex(progress.current_month).name}
              </div>
              <div className="text-[9px] uppercase text-[color:var(--tx3)]">Nivel atual</div>
            </div>
            <div>
              <div className="font-[family-name:var(--font-display)] text-lg tracking-wider">
                Sem {progress.current_week + 1}
              </div>
              <div className="text-[9px] uppercase text-[color:var(--tx3)]">Semana</div>
            </div>
            <div>
              <div className="font-[family-name:var(--font-display)] text-lg tracking-wider" style={{ color: "var(--gn)" }}>
                {daysSinceJoin}
              </div>
              <div className="text-[9px] uppercase text-[color:var(--tx3)]">Dias ativo</div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function StatCard({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="ks-box">
      <div className="ks-v" style={{ color }}>{value.toLocaleString("pt-BR")}</div>
      <div className="ks-l">{label}</div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[color:var(--bd)] bg-[color:var(--s1)] px-3 py-2 text-center">
      <div className="font-[family-name:var(--font-display)] text-base tracking-wider">{value}</div>
      <div className="text-[8px] uppercase tracking-wider text-[color:var(--tx3)]">{label}</div>
    </div>
  );
}

function HealthKpi({
  value,
  label,
  color,
  suffix,
}: {
  value: number | null;
  label: string;
  color: string;
  suffix?: string;
}) {
  return (
    <div className="rounded-lg bg-[color:var(--s2)] px-3 py-2 text-center">
      <div
        className="font-[family-name:var(--font-display)] text-lg tracking-wider"
        style={{ color: value == null ? "var(--tx3)" : color }}
      >
        {value == null ? "—" : value.toLocaleString("pt-BR")}
        {value != null && suffix ? <span className="ml-1 text-[10px] text-[color:var(--tx3)]">{suffix}</span> : null}
      </div>
      <div className="text-[8px] uppercase tracking-wider text-[color:var(--tx3)]">{label}</div>
    </div>
  );
}
