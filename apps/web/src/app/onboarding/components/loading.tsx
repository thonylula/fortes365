"use client";

import { useEffect, useState } from "react";

const MESSAGES = [
  { text: "Analisando seu perfil...", emoji: "🔍" },
  { text: "Calculando seu nível de fitness...", emoji: "📊" },
  { text: "Selecionando exercícios ideais...", emoji: "💪" },
  { text: "Montando seu plano de nutrição...", emoji: "🥗" },
  { text: "Finalizando seu plano personalizado...", emoji: "✨" },
];

export function Loading({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => {
        const next = p + Math.random() * 6 + 2;
        if (next >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 600);
          return 100;
        }
        return next;
      });
    }, 180);
    return () => clearInterval(interval);
  }, [onComplete]);

  const msgIndex = Math.min(Math.floor(progress / 20), MESSAGES.length - 1);
  const msg = MESSAGES[msgIndex];

  return (
    <div className="flex flex-col items-center justify-center py-8">
      {/* Animated rings + percentage */}
      <div className="relative mb-10 h-48 w-48">
        {/* Outer spinning ring */}
        <div
          className="absolute inset-0 animate-spin rounded-full border-2 border-transparent"
          style={{
            borderTopColor: "var(--or)",
            animationDuration: "3s",
          }}
        />
        {/* Middle ring */}
        <div
          className="absolute inset-3 animate-spin rounded-full border border-transparent"
          style={{
            borderRightColor: "rgba(255,85,0,0.3)",
            animationDuration: "2s",
            animationDirection: "reverse",
          }}
        />

        {/* SVG progress arc */}
        <svg viewBox="0 0 120 120" className="absolute inset-4 h-[calc(100%-32px)] w-[calc(100%-32px)] -rotate-90">
          <circle cx="60" cy="60" r="52" fill="none" stroke="var(--s2)" strokeWidth="6" />
          <circle
            cx="60"
            cy="60"
            r="52"
            fill="none"
            stroke="var(--or)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 52}`}
            strokeDashoffset={`${2 * Math.PI * 52 * (1 - progress / 100)}`}
            className="transition-all duration-300"
          />
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-[family-name:var(--font-display)] text-5xl tracking-wider" style={{ color: "var(--or)" }}>
            {Math.round(progress)}
          </span>
          <span className="font-[family-name:var(--font-condensed)] text-xs tracking-wider text-[color:var(--tx3)]">%</span>
        </div>
      </div>

      {/* Animated message */}
      <div className="flex items-center gap-2 rounded-xl border border-[color:var(--bd)] bg-[color:var(--s1)] px-5 py-3">
        <span className="text-lg">{msg.emoji}</span>
        <span className="text-sm text-[color:var(--tx2)]">{msg.text}</span>
      </div>

      {/* Social proof */}
      <div className="mt-10 text-center">
        <p className="font-[family-name:var(--font-display)] text-lg tracking-wider" style={{ color: "var(--or)" }}>
          Mais de 10 mil pessoas
        </p>
        <p className="mt-1 text-xs text-[color:var(--tx3)]">
          já treinam com o FORTE 365
        </p>
      </div>
    </div>
  );
}
