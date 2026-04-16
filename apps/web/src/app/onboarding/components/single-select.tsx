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
    <div className="flex flex-col gap-2.5">
      {step.options?.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onSelect(opt.value)}
            className="group flex items-center gap-3 rounded-2xl border px-5 py-4 text-left text-sm transition-all duration-200"
            style={{
              borderColor: active ? "var(--or)" : "var(--bd)",
              background: active ? "var(--ord)" : "var(--s1)",
              transform: active ? "scale(1.01)" : "scale(1)",
              boxShadow: active ? "0 0 20px rgba(255,85,0,0.1)" : "none",
            }}
          >
            {opt.emoji && <span className="text-xl">{opt.emoji}</span>}
            <span className="flex-1 font-medium">{opt.label}</span>
            <div
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-[10px] transition-all"
              style={{
                borderColor: active ? "var(--or)" : "var(--bd)",
                background: active ? "var(--or)" : "transparent",
                color: active ? "#000" : "transparent",
              }}
            >
              ✓
            </div>
          </button>
        );
      })}
    </div>
  );
}
