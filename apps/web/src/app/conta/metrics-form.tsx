"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveUserMetrics } from "./actions";
import {
  ACTIVITY_LABEL,
  GOAL_LABEL,
  SEX_LABEL,
  type ActivityLevel,
  type Goal,
  type Sex,
} from "@/lib/macros";

type InitialMetrics = {
  weight_kg?: number | null;
  height_cm?: number | null;
  sex?: string | null;
  birth_date?: string | null;
  activity_level?: string | null;
  goal?: string | null;
};

export function MetricsForm({ initial }: { initial: InitialMetrics }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [weight, setWeight] = useState(initial.weight_kg?.toString() ?? "");
  const [height, setHeight] = useState(initial.height_cm?.toString() ?? "");
  const [sex, setSex] = useState<Sex | "">((initial.sex as Sex) ?? "");
  const [birthDate, setBirthDate] = useState(initial.birth_date ?? "");
  const [activity, setActivity] = useState<ActivityLevel | "">(
    (initial.activity_level as ActivityLevel) ?? "",
  );
  const [goal, setGoal] = useState<Goal | "">((initial.goal as Goal) ?? "");

  function submit() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("weight_kg", weight);
      fd.set("height_cm", height);
      fd.set("sex", sex);
      fd.set("birth_date", birthDate);
      fd.set("activity_level", activity);
      fd.set("goal", goal);
      const res = await saveUserMetrics(fd);
      if (!res.ok) {
        setError(res.error ?? "Erro ao salvar.");
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Peso (kg)">
          <input
            type="number"
            step="0.1"
            min="30"
            max="300"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="75"
            className="metrics-input"
          />
        </Field>
        <Field label="Altura (cm)">
          <input
            type="number"
            step="1"
            min="100"
            max="250"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            placeholder="175"
            className="metrics-input"
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Sexo biológico">
          <select
            value={sex}
            onChange={(e) => setSex(e.target.value as Sex)}
            className="metrics-input"
          >
            <option value="">Selecione…</option>
            {(Object.keys(SEX_LABEL) as Sex[]).map((s) => (
              <option key={s} value={s}>
                {SEX_LABEL[s]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Data de nascimento">
          <input
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className="metrics-input"
          />
        </Field>
      </div>

      <Field label="Nível de atividade">
        <select
          value={activity}
          onChange={(e) => setActivity(e.target.value as ActivityLevel)}
          className="metrics-input"
        >
          <option value="">Selecione…</option>
          {(Object.keys(ACTIVITY_LABEL) as ActivityLevel[]).map((a) => (
            <option key={a} value={a}>
              {ACTIVITY_LABEL[a]}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Objetivo">
        <select
          value={goal}
          onChange={(e) => setGoal(e.target.value as Goal)}
          className="metrics-input"
        >
          <option value="">Selecione…</option>
          {(Object.keys(GOAL_LABEL) as Goal[]).map((g) => (
            <option key={g} value={g}>
              {GOAL_LABEL[g]}
            </option>
          ))}
        </select>
      </Field>

      {error && (
        <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </div>
      )}
      {saved && (
        <div className="rounded-md border border-[color:var(--gn)]/40 bg-[color:var(--gn)]/10 px-3 py-2 text-sm text-[color:var(--gn)]">
          Perfil salvo. Suas metas foram recalculadas.
        </div>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={
          isPending || !weight || !height || !sex || !birthDate || !activity || !goal
        }
        className="act-btn is-lg is-primary"
      >
        {isPending ? "Salvando..." : "Salvar perfil científico"}
      </button>

      <p className="text-[10px] text-[color:var(--tx3)] leading-relaxed">
        Cálculo via Mifflin-St Jeor (1990) + ISSN Position Stand on Protein (2017)
        + ACSM Guidelines. Margem de erro do BMR: ~10%. Recomendado validar com
        nutricionista para casos clínicos.
      </p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-[family-name:var(--font-condensed)] text-[10px] font-bold uppercase tracking-[2px] text-[color:var(--tx3)]">
        {label}
      </span>
      {children}
    </label>
  );
}
