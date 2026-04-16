"use client";

import { STEPS, SECTIONS, SECTION_LABELS } from "../steps";

export function ProgressBar({ currentStep }: { currentStep: number }) {
  const totalReal = STEPS.filter((s) => s.type !== "interstitial" && s.type !== "loading").length;
  const doneReal = STEPS.filter((s, i) => i < currentStep && s.type !== "interstitial" && s.type !== "loading").length;
  const overallPct = totalReal > 0 ? (doneReal / totalReal) * 100 : 0;

  const currentSection = STEPS[currentStep]?.section;

  return (
    <div className="px-4 pt-3 pb-1">
      {/* Section dots */}
      <div className="mb-2 flex items-center justify-center gap-1">
        {SECTIONS.map((section) => {
          const isCurrent = section === currentSection;
          const sectionSteps = STEPS.filter((s) => s.section === section);
          const sectionStart = STEPS.indexOf(sectionSteps[0]);
          const isDone = currentStep > sectionStart + sectionSteps.length - 1;
          return (
            <div key={section} className="flex items-center gap-1">
              <div
                className="flex items-center gap-1 rounded-full px-2 py-0.5 transition-all"
                style={{
                  background: isCurrent ? "var(--ord)" : "transparent",
                  border: isCurrent ? "1px solid rgba(255,85,0,0.3)" : "1px solid transparent",
                }}
              >
                <div
                  className="h-1.5 w-1.5 rounded-full transition-all"
                  style={{ background: isDone ? "var(--gn)" : isCurrent ? "var(--or)" : "var(--s2)" }}
                />
                <span
                  className="font-[family-name:var(--font-condensed)] text-[8px] font-bold uppercase tracking-[1px] transition-colors"
                  style={{ color: isCurrent ? "var(--or)" : isDone ? "var(--gn)" : "var(--tx3)" }}
                >
                  {SECTION_LABELS[section]}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Overall progress bar */}
      <div className="h-[3px] rounded-full bg-[color:var(--s2)]">
        <div
          className="h-[3px] rounded-full transition-all duration-500"
          style={{ width: `${overallPct}%`, background: "linear-gradient(90deg, var(--or), #ff9944)" }}
        />
      </div>
    </div>
  );
}
