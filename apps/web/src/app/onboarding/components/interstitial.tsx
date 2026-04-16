"use client";

import type { QuizStep } from "../steps";

export function Interstitial({ step }: { step: QuizStep }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="mb-4 text-4xl">💪</div>
      <h2 className="font-[family-name:var(--font-display)] text-xl leading-tight tracking-wider text-[color:var(--or)]">
        {step.interstitialTitle}
      </h2>
      <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-[color:var(--tx2)]">
        {step.interstitialText}
      </p>
    </div>
  );
}
