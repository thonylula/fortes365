"use client";

import { useEffect, useState } from "react";

const MESSAGES = [
  "Analisando seu perfil...",
  "Calculando seu nível de fitness...",
  "Selecionando exercícios ideais...",
  "Montando seu plano personalizado...",
  "Quase pronto!",
];

export function Loading({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => {
        const next = p + Math.random() * 8 + 2;
        if (next >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 500);
          return 100;
        }
        return next;
      });
    }, 150);
    return () => clearInterval(interval);
  }, [onComplete]);

  const msgIndex = Math.min(
    Math.floor(progress / 20),
    MESSAGES.length - 1,
  );

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="relative mb-8 h-40 w-40">
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
          <circle cx="60" cy="60" r="52" fill="none" stroke="var(--s2)" strokeWidth="8" />
          <circle
            cx="60"
            cy="60"
            r="52"
            fill="none"
            stroke="var(--or)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 52}`}
            strokeDashoffset={`${2 * Math.PI * 52 * (1 - progress / 100)}`}
            className="transition-all duration-300"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-[family-name:var(--font-display)] text-4xl tracking-wider">
            {Math.round(progress)}
            <span className="text-lg text-[color:var(--tx2)]">%</span>
          </span>
        </div>
      </div>

      <p className="text-center text-sm text-[color:var(--tx2)]">
        {MESSAGES[msgIndex]}
      </p>

      <div className="mt-8 max-w-xs">
        <p className="text-center font-[family-name:var(--font-display)] text-lg tracking-wider text-[color:var(--or)]">
          Mais de 10 mil pessoas
        </p>
        <p className="mt-1 text-center text-xs text-[color:var(--tx3)]">
          Escolheram o FORTE 365
        </p>
      </div>
    </div>
  );
}
