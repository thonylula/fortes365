"use client";

import type { QuizStep } from "../steps";

export function SingleSelect({
  step,
  value,
  onSelect,
}: {
  step: QuizStep;
  value: string | undefined;
  onSelect: (val: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      {step.options?.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onSelect(opt.value)}
          className="flex items-center gap-3 rounded-xl border px-5 py-4 text-left text-sm transition-all"
          style={{
            borderColor: value === opt.value ? "var(--or)" : "var(--bd)",
            background: value === opt.value ? "var(--ord)" : "var(--s1)",
          }}
        >
          {opt.emoji && <span className="text-lg">{opt.emoji}</span>}
          <span className="flex-1">{opt.label}</span>
          <div
            className="h-5 w-5 shrink-0 rounded-full border-2 transition-all"
            style={{
              borderColor: value === opt.value ? "var(--or)" : "var(--bd)",
              background: value === opt.value ? "var(--or)" : "transparent",
            }}
          />
        </button>
      ))}
    </div>
  );
}
