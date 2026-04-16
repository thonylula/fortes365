"use client";

import type { QuizStep } from "../steps";

export function MultiSelect({
  step,
  value,
  onSelect,
}: {
  step: QuizStep;
  value: string[];
  onSelect: (val: string[]) => void;
}) {
  const toggle = (v: string) => {
    if (v === "none") {
      onSelect(["none"]);
      return;
    }
    const without = value.filter((x) => x !== "none");
    if (without.includes(v)) {
      onSelect(without.filter((x) => x !== v));
    } else {
      onSelect([...without, v]);
    }
  };

  return (
    <div className="flex flex-col gap-2.5">
      {step.options?.map((opt) => {
        const checked = value.includes(opt.value);
        return (
          <button
            key={opt.value}
            onClick={() => toggle(opt.value)}
            className="flex items-center gap-3 rounded-2xl border px-5 py-4 text-left text-sm transition-all duration-200"
            style={{
              borderColor: checked ? "var(--or)" : "var(--bd)",
              background: checked ? "var(--ord)" : "var(--s1)",
              boxShadow: checked ? "0 0 15px rgba(255,85,0,0.08)" : "none",
            }}
          >
            {opt.emoji && <span className="text-xl">{opt.emoji}</span>}
            <span className="flex-1 font-medium">{opt.label}</span>
            <div
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 text-[10px] font-bold transition-all"
              style={{
                borderColor: checked ? "var(--or)" : "var(--bd)",
                background: checked ? "var(--or)" : "transparent",
                color: checked ? "#000" : "transparent",
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
