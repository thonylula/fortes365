"use client";

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

  if (score <= 1) return { label: "Iniciante", level: 0 };
  if (score <= 3) return { label: "Básico", level: 1 };
  if (score <= 6) return { label: "Intermediário", level: 2 };
  return { label: "Avançado", level: 3 };
}

const BODY_TYPE_LABELS: Record<string, string> = {
  slim: "Ectomorfo",
  average: "Mesomorfo",
  stocky: "Endomorfo",
  overweight: "Endomorfo",
};

const ACTIVITY_LABELS: Record<string, string> = {
  sitting: "Sedentário",
  active_breaks: "Moderadamente ativo",
  standing: "Ativo",
};

export function Summary({ answers }: { answers: Answers }) {
  const height = answers.height_cm as number | undefined;
  const weight = answers.weight_kg as number | undefined;
  const bmi = height && weight ? weight / ((height / 100) ** 2) : null;
  const bmiLabel = bmi
    ? bmi < 18.5 ? "Abaixo do peso" : bmi < 25 ? "Normal" : bmi < 30 ? "Sobrepeso" : "Obesidade"
    : "—";
  const phase = calculatePhase(answers);
  const bodyType = BODY_TYPE_LABELS[answers.body_type as string] ?? "—";
  const activity = ACTIVITY_LABELS[answers.daily_activity as string] ?? "—";

  return (
    <div className="mx-auto max-w-sm space-y-4">
      {bmi != null && (
        <div className="rounded-xl border border-[color:var(--bd)] bg-[color:var(--s1)] p-4">
          <div className="mb-1 font-[family-name:var(--font-condensed)] text-[10px] font-bold uppercase tracking-wider text-[color:var(--tx3)]">
            Índice de Massa Corporal (IMC)
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold" style={{ color: bmi < 25 ? "var(--gn)" : bmi < 30 ? "var(--or)" : "var(--pk)" }}>
              {bmi.toFixed(1)}
            </span>
            <span className="text-sm text-[color:var(--tx2)]">{bmiLabel}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <InfoCard label="Tipo corporal" value={bodyType} emoji="🧬" />
        <InfoCard label="Estilo de vida" value={activity} emoji="🏃" />
        <InfoCard label="Nível fitness" value={phase.label} emoji="💪" />
        <InfoCard
          label="Ganho de peso"
          value={
            (answers.calisthenics_level as string) === "starting"
              ? "Lento e fácil"
              : "Ganho e perco"
          }
          emoji="⚖️"
        />
      </div>
    </div>
  );
}

function InfoCard({ label, value, emoji }: { label: string; value: string; emoji: string }) {
  return (
    <div className="rounded-xl border border-[color:var(--bd)] bg-[color:var(--s1)] p-3">
      <div className="mb-1 flex items-center gap-1.5">
        <span className="text-sm">{emoji}</span>
        <span className="font-[family-name:var(--font-condensed)] text-[9px] font-bold uppercase tracking-wider text-[color:var(--tx3)]">
          {label}
        </span>
      </div>
      <div className="text-sm font-bold text-[color:var(--or)]">{value}</div>
    </div>
  );
}
