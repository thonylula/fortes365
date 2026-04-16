"use client";

import { STEPS, SECTIONS, SECTION_LABELS } from "../steps";

export function ProgressBar({ currentStep }: { currentStep: number }) {
  const sectionProgress = SECTIONS.map((section) => {
    const sectionSteps = STEPS.filter((s) => s.section === section);
    const startIdx = STEPS.indexOf(sectionSteps[0]);
    const endIdx = startIdx + sectionSteps.length;
    const completed = Math.max(0, Math.min(currentStep - startIdx, sectionSteps.length));
    const pct = sectionSteps.length > 0 ? (completed / sectionSteps.length) * 100 : 0;
    return { section, label: SECTION_LABELS[section], pct, active: currentStep >= startIdx && currentStep < endIdx };
  });

  return (
    <div className="flex gap-1.5 px-4 pt-4 pb-2">
      {sectionProgress.map((s) => (
        <div key={s.section} className="flex-1">
          <div className="mb-1 text-center font-[family-name:var(--font-condensed)] text-[8px] font-bold uppercase tracking-[1.5px]"
            style={{ color: s.active ? "var(--or)" : "var(--tx3)" }}
          >
            {s.label}
          </div>
          <div className="h-1 rounded-full bg-[color:var(--s2)]">
            <div
              className="h-1 rounded-full transition-all duration-300"
              style={{ width: `${s.pct}%`, background: "var(--or)" }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
