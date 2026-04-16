"use client";

import type { QuizStep } from "../steps";

const GRADIENTS: Record<string, string> = {
  "18-29": "linear-gradient(135deg, #1a0a00, #331500)",
  "30-39": "linear-gradient(135deg, #0a1a00, #153300)",
  "40-49": "linear-gradient(135deg, #000a1a, #001533)",
  "50+": "linear-gradient(135deg, #1a001a, #330033)",
  defined: "linear-gradient(135deg, #1a0500, #331a00)",
  athletic: "linear-gradient(135deg, #001a0a, #003315)",
  shredded: "linear-gradient(135deg, #1a1000, #332500)",
  muscular: "linear-gradient(135deg, #0a001a, #150033)",
  slim: "linear-gradient(135deg, #0a1a1a, #153333)",
  average: "linear-gradient(135deg, #1a1a0a, #333315)",
  stocky: "linear-gradient(135deg, #1a0a0a, #331515)",
  overweight: "linear-gradient(135deg, #0a0a1a, #151533)",
  gym: "linear-gradient(135deg, #1a0800, #331800)",
  home: "linear-gradient(135deg, #001a10, #003322)",
};

export function SingleCard({
  step,
  value,
  onSelect,
}: {
  step: QuizStep;
  value: string | undefined;
  onSelect: (val: string) => void;
}) {
  const count = step.options?.length ?? 0;
  const cols = count <= 2 ? "grid-cols-2" : count <= 3 ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-4";

  return (
    <div className={`grid ${cols} gap-3`}>
      {step.options?.map((opt) => {
        const active = value === opt.value;
        const bg = GRADIENTS[opt.value] ?? "linear-gradient(135deg, var(--s1), var(--s2))";
        return (
          <button
            key={opt.value}
            onClick={() => onSelect(opt.value)}
            className="relative flex flex-col items-center gap-3 overflow-hidden rounded-2xl border-2 p-6 transition-all duration-200"
            style={{
              borderColor: active ? "var(--or)" : "transparent",
              background: bg,
              boxShadow: active ? "0 0 30px rgba(255,85,0,0.2), inset 0 0 30px rgba(255,85,0,0.05)" : "none",
              transform: active ? "scale(1.03)" : "scale(1)",
            }}
          >
            {/* Glow overlay when active */}
            {active && (
              <div className="absolute inset-0 rounded-2xl" style={{ background: "radial-gradient(circle at center, rgba(255,85,0,0.1) 0%, transparent 70%)" }} />
            )}

            <span className="relative text-4xl">{opt.emoji}</span>
            <span className="relative font-[family-name:var(--font-condensed)] text-xs font-bold uppercase tracking-wider">
              {opt.label}
            </span>

            {/* Selection indicator */}
            {active && (
              <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full text-[10px]" style={{ background: "var(--or)", color: "#000" }}>
                ✓
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
