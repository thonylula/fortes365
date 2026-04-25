import {
  ACTIVITY_LABEL,
  GOAL_LABEL,
  calculateAge,
  calculateBMR,
  calculateMacros,
  calculateTDEE,
  metricsFromProfile,
} from "@/lib/macros";

type ProfileData = {
  weight_kg?: number | null;
  height_cm?: number | null;
  sex?: string | null;
  birth_date?: string | null;
  activity_level?: string | null;
  goal?: string | null;
};

export function MetricsCard({ profile }: { profile: ProfileData }) {
  const metrics = metricsFromProfile(profile);

  if (!metrics) {
    return (
      <div className="rounded-lg border border-dashed border-[color:var(--bd)] bg-[color:var(--s1)] p-5">
        <div className="slbl mb-2">Suas metas científicas</div>
        <p className="text-xs text-[color:var(--tx3)] leading-relaxed">
          Preencha o perfil ao lado pra calcular sua TMB, TDEE e macros (kcal,
          proteína, carboidrato, gordura) com base científica.
        </p>
      </div>
    );
  }

  const age = calculateAge(metrics.birth_date);
  const bmr = Math.round(calculateBMR(metrics));
  const tdee = Math.round(calculateTDEE(metrics));
  const m = calculateMacros(metrics);

  // Distribuição calórica (pra mostrar % de cada macro)
  const proteinKcal = m.protein_g * 4;
  const carbKcal = m.carb_g * 4;
  const fatKcal = m.fat_g * 9;
  const totalMacroKcal = proteinKcal + carbKcal + fatKcal;
  const proteinPct = Math.round((proteinKcal / totalMacroKcal) * 100);
  const carbPct = Math.round((carbKcal / totalMacroKcal) * 100);
  const fatPct = 100 - proteinPct - carbPct;

  return (
    <div className="rounded-lg border border-[color:var(--or)]/30 bg-gradient-to-br from-[color:var(--ord)] to-[color:var(--s1)] p-6">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <div className="slbl">Suas metas (calculadas)</div>
        <div className="font-[family-name:var(--font-condensed)] text-[10px] uppercase tracking-[1.5px] text-[color:var(--tx3)]">
          Mifflin-St Jeor · ISSN 2017
        </div>
      </div>

      {/* Linha 1: BMR / TDEE / Idade */}
      <div className="mb-5 grid grid-cols-3 gap-3">
        <Stat label="TMB" value={bmr} unit="kcal" hint="basal" />
        <Stat label="TDEE" value={tdee} unit="kcal" hint="diário" />
        <Stat label="Idade" value={age} unit="anos" />
      </div>

      {/* Meta calórica destacada */}
      <div className="mb-5 rounded-md bg-black/30 px-5 py-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="font-[family-name:var(--font-condensed)] text-[10px] font-bold uppercase tracking-[2px] text-[color:var(--tx2)]">
            Meta calórica diária
          </span>
          <span className="rounded-sm bg-[color:var(--ord)] px-2 py-0.5 font-[family-name:var(--font-condensed)] text-[10px] font-bold uppercase tracking-[1.5px] text-[color:var(--or)]">
            {GOAL_LABEL[metrics.goal]}
          </span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="font-[family-name:var(--font-display)] text-5xl text-[color:var(--or)] leading-none">
            {m.kcal}
          </span>
          <span className="font-[family-name:var(--font-mono)] text-base text-[color:var(--tx3)]">
            kcal/dia
          </span>
        </div>
      </div>

      {/* Macros — empilha em col-span menor pra evitar aperto */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <MacroBox
          label="Proteína"
          grams={m.protein_g}
          kcal={proteinKcal}
          pct={proteinPct}
          color="var(--or)"
        />
        <MacroBox
          label="Carboidrato"
          grams={m.carb_g}
          kcal={carbKcal}
          pct={carbPct}
          color="var(--gn)"
        />
        <MacroBox
          label="Gordura"
          grams={m.fat_g}
          kcal={fatKcal}
          pct={fatPct}
          color="#facc15"
        />
      </div>

      {/* Barra horizontal mostrando proporção visual */}
      <div className="mt-4 flex h-2 overflow-hidden rounded-full bg-[color:var(--s2)]">
        <div style={{ width: `${proteinPct}%`, background: "var(--or)" }} />
        <div style={{ width: `${carbPct}%`, background: "var(--gn)" }} />
        <div style={{ width: `${fatPct}%`, background: "#facc15" }} />
      </div>

      <p className="mt-4 text-[11px] leading-relaxed text-[color:var(--tx3)]">
        Atividade: {ACTIVITY_LABEL[metrics.activity_level]} · Proteína:{" "}
        {(m.protein_g / metrics.weight_kg).toFixed(1)}g/kg · Gordura:{" "}
        {(m.fat_g / metrics.weight_kg).toFixed(2)}g/kg
      </p>
    </div>
  );
}

function Stat({
  label,
  value,
  unit,
  hint,
}: {
  label: string;
  value: number;
  unit: string;
  hint?: string;
}) {
  return (
    <div className="rounded-md bg-black/20 px-3 py-3">
      <div className="font-[family-name:var(--font-condensed)] text-[10px] font-bold uppercase tracking-[2px] text-[color:var(--tx3)]">
        {label}
      </div>
      <div className="mt-1.5 flex items-baseline gap-1">
        <span className="font-[family-name:var(--font-mono)] text-lg font-bold text-[color:var(--tx)]">
          {value}
        </span>
        <span className="font-[family-name:var(--font-mono)] text-[10px] text-[color:var(--tx3)]">
          {unit}
        </span>
      </div>
      {hint && (
        <div className="mt-1 font-[family-name:var(--font-condensed)] text-[9px] uppercase tracking-[1.5px] text-[color:var(--tx3)]">
          {hint}
        </div>
      )}
    </div>
  );
}

function MacroBox({
  label,
  grams,
  kcal,
  pct,
  color,
}: {
  label: string;
  grams: number;
  kcal: number;
  pct: number;
  color: string;
}) {
  return (
    <div
      className="rounded-md border bg-black/20 px-3 py-3"
      style={{ borderColor: `${color}33` }}
    >
      <div
        className="font-[family-name:var(--font-condensed)] text-[10px] font-bold uppercase tracking-[2px]"
        style={{ color }}
      >
        {label}
      </div>
      <div className="mt-1.5 flex items-baseline gap-1">
        <span
          className="font-[family-name:var(--font-display)] text-3xl leading-none"
          style={{ color }}
        >
          {grams}
        </span>
        <span className="font-[family-name:var(--font-mono)] text-xs text-[color:var(--tx3)]">
          g
        </span>
      </div>
      <div className="mt-1.5 flex items-center justify-between font-[family-name:var(--font-mono)] text-[10px] text-[color:var(--tx3)]">
        <span>{kcal}kcal</span>
        <span style={{ color }}>{pct}%</span>
      </div>
    </div>
  );
}
