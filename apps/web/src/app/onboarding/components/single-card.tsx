"use client";

import type { QuizStep } from "../steps";

export function SingleCard({
  step,
  value,
  onSelect,
}: {
  step: QuizStep;
  value: string | undefined;
  onSelect: (val: string) => void;
}) {
  const cols = (step.options?.length ?? 0) <= 3 ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-4";

  return (
    <div className={`grid ${cols} gap-3`}>
      {step.options?.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onSelect(opt.value)}
            className="flex flex-col items-center gap-2 rounded-xl border p-5 transition-all"
            style={{
              borderColor: active ? "var(--or)" : "var(--bd)",
              background: active ? "var(--ord)" : "var(--s1)",
              boxShadow: active ? "0 0 20px rgba(255,85,0,0.15)" : "none",
            }}
          >
            {opt.emoji && <span className="text-3xl">{opt.emoji}</span>}
            <span className="text-center font-[family-name:var(--font-condensed)] text-xs font-bold uppercase tracking-wider">
              {opt.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
