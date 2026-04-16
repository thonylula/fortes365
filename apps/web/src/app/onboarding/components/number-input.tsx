"use client";

import { useState } from "react";
import type { QuizStep } from "../steps";

export function NumberInput({
  step,
  value,
  onSelect,
  allAnswers,
}: {
  step: QuizStep;
  value: number | undefined;
  onSelect: (val: number) => void;
  allAnswers: Record<string, unknown>;
}) {
  const [raw, setRaw] = useState(value?.toString() ?? "");
  const num = parseFloat(raw);
  const valid = !isNaN(num) && num >= (step.min ?? 0) && num <= (step.max ?? 999);

  const bmi =
    step.id === "weight_kg" && valid && typeof allAnswers.height_cm === "number"
      ? num / ((allAnswers.height_cm / 100) ** 2)
      : null;

  const bmiLabel = bmi
    ? bmi < 18.5 ? "abaixo do peso" : bmi < 25 ? "peso normal" : bmi < 30 ? "sobrepeso" : "obesidade"
    : null;

  return (
    <div className="mx-auto max-w-sm">
      <div className="rounded-xl border border-[color:var(--bd)] bg-[color:var(--s1)] p-6">
        <div className="flex items-baseline justify-center gap-2">
          <input
            type="text"
            inputMode="numeric"
            value={raw}
            onChange={(e) => {
              const cleaned = e.target.value.replace(/[^0-9.,]/g, "");
              setRaw(cleaned);
              const parsed = parseFloat(cleaned);
              if (!isNaN(parsed) && parsed >= (step.min ?? 0) && parsed <= (step.max ?? 999)) {
                onSelect(parsed);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && valid) onSelect(num);
            }}
            placeholder={step.suffix === "cm" ? "Altura" : step.suffix === "kg" ? "Peso" : "Valor"}
            className="w-32 border-b-2 border-[color:var(--or)] bg-transparent text-center text-4xl font-bold text-[color:var(--tx)] outline-none placeholder:text-[color:var(--tx3)]"
            autoFocus
          />
          <span className="text-xl text-[color:var(--tx2)]">{step.suffix}</span>
        </div>

        {step.min != null && step.max != null && (
          <p className="mt-3 text-center text-[11px] text-[color:var(--or)]">
            Por favor, insira um valor entre {step.min} {step.suffix} e {step.max} {step.suffix}.
          </p>
        )}

        {bmi != null && (
          <div className="mt-4 rounded-lg bg-[color:var(--s2)] p-3 text-xs">
            <p className="font-bold text-[color:var(--tx)]">
              Seu IMC é {bmi.toFixed(1)}, o que é considerado {bmiLabel}.
            </p>
            <p className="mt-1 text-[color:var(--tx3)]">
              Usaremos seu IMC para criar um programa personalizado para você.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
