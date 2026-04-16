"use client";

import { useEffect, useState } from "react";
import type { QuizStep } from "../steps";

const ICONS = ["💪", "🔥", "⚡", "🏆", "🎯"];

export function Interstitial({ step }: { step: QuizStep }) {
  const [visible, setVisible] = useState(false);
  const icon = ICONS[Math.abs(step.id.charCodeAt(step.id.length - 1)) % ICONS.length];

  useEffect(() => {
    setTimeout(() => setVisible(true), 100);
  }, [step.id]);

  return (
    <div
      className="flex flex-col items-center justify-center py-6 text-center transition-all duration-700"
      style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)" }}
    >
      {/* Glowing icon */}
      <div className="relative mb-6">
        <div className="text-6xl">{icon}</div>
        <div
          className="absolute -inset-4 -z-10 animate-pulse rounded-full"
          style={{ background: "radial-gradient(circle, rgba(255,85,0,0.15) 0%, transparent 70%)" }}
        />
      </div>

      <h2 className="max-w-sm font-[family-name:var(--font-display)] text-xl leading-snug tracking-wider text-[color:var(--or)]">
        {step.interstitialTitle}
      </h2>

      <div className="mx-auto mt-5 max-w-md rounded-2xl border border-[color:var(--bd)] bg-[color:var(--s1)] p-5">
        <p className="text-sm leading-relaxed text-[color:var(--tx2)]">
          {step.interstitialText}
        </p>
      </div>
    </div>
  );
}
