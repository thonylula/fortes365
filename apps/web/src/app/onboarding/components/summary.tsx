"use client";

import { useEffect, useState } from "react";

type Answers = Record<string, unknown>;

function calculatePhase(answers: Answers) {
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

  if (score <= 1) return { label: "Iniciante", level: 0, color: "var(--bl)" };
  if (score <= 3) return { label: "Básico", level: 1, color: "var(--gn)" };
  if (score <= 6) return { label: "Intermediário", level: 2, color: "var(--or)" };
  return { label: "Avançado", level: 3, color: "var(--pk)" };
}

const BODY_TYPE_LABELS: Record<string, string> = {
  slim: "Ectomorfo", average: "Mesomorfo", stocky: "Endomorfo", overweight: "Endomorfo",
};

const ACTIVITY_LABELS: Record<string, string> = {
  sitting: "Sedentário", active_breaks: "Moderadamente ativo", standing: "Ativo",
};

export function Summary({ answers }: { answers: Answers }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { setTimeout(() => setVisible(true), 200); }, []);

  const height = answers.height_cm as number | undefined;
  const weight = answers.weight_kg as number | undefined;
  const bmi = height && weight ? weight / ((height / 100) ** 2) : null;
  const bmiLabel = bmi
    ? bmi < 18.5 ? "Abaixo do peso" : bmi < 25 ? "Normal" : bmi < 30 ? "Sobrepeso" : "Obesidade"
    : "—";
  const bmiColor = bmi
    ? bmi < 18.5 ? "var(--bl)" : bmi < 25 ? "var(--gn)" : bmi < 30 ? "var(--or)" : "var(--pk)"
    : "var(--tx3)";
  const phase = calculatePhase(answers);
  const bodyType = BODY_TYPE_LABELS[answers.body_type as string] ?? "—";
  const activity = ACTIVITY_LABELS[answers.daily_activity as string] ?? "—";

  return (
    <div
      className="mx-auto max-w-sm space-y-4 transition-all duration-700"
      style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)" }}
    >
      {/* BMI Hero */}
      {bmi != null && (
        <div className="relative overflow-hidden rounded-2xl border border-[color:var(--bd)] bg-[color:var(--s1)] p-6 text-center">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-10" style={{ background: bmiColor }} />
          <div className="mb-1 font-[family-name:var(--font-condensed)] text-[10px] font-bold uppercase tracking-[2px] text-[color:var(--tx3)]">
            Índice de Massa Corporal
          </div>
          <div className="flex items-baseline justify-center gap-2">
            <span className="font-[family-name:var(--font-display)] text-5xl tracking-wider" style={{ color: bmiColor }}>
              {bmi.toFixed(1)}
            </span>
          </div>
          <div className="mt-1 text-sm font-bold" style={{ color: bmiColor }}>{bmiLabel}</div>

          {/* BMI Scale bar */}
          <div className="mx-auto mt-4 flex h-2 max-w-[200px] overflow-hidden rounded-full">
            <div className="flex-1" style={{ background: "var(--bl)" }} />
            <div className="flex-1" style={{ background: "var(--gn)" }} />
            <div className="flex-1" style={{ background: "var(--or)" }} />
            <div className="flex-1" style={{ background: "var(--pk)" }} />
          </div>
          <div className="mx-auto mt-1 flex max-w-[200px] justify-between text-[8px] text-[color:var(--tx3)]">
            <span>18.5</span><span>25</span><span>30</span><span>40</span>
          </div>
        </div>
      )}

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-3">
        <InfoCard label="Tipo corporal" value={bodyType} emoji="🧬" />
        <InfoCard label="Estilo de vida" value={activity} emoji="🏃" />
        <InfoCard label="Nível fitness" value={phase.label} emoji="💪" color={phase.color} />
        <InfoCard
          label="Fase inicial"
          value={`Fase ${phase.level}`}
          emoji="📍"
          color={phase.color}
        />
      </div>
    </div>
  );
}

function InfoCard({ label, value, emoji, color }: { label: string; value: string; emoji: string; color?: string }) {
  return (
    <div className="rounded-2xl border border-[color:var(--bd)] bg-[color:var(--s1)] p-4">
      <div className="mb-2 flex items-center gap-1.5">
        <span className="text-base">{emoji}</span>
        <span className="font-[family-name:var(--font-condensed)] text-[9px] font-bold uppercase tracking-[1.5px] text-[color:var(--tx3)]">
          {label}
        </span>
      </div>
      <div className="font-[family-name:var(--font-display)] text-base tracking-wider" style={{ color: color ?? "var(--or)" }}>
        {value}
      </div>
    </div>
  );
}
