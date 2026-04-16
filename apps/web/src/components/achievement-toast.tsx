"use client";

import { useEffect, useState } from "react";

type AchievementInfo = {
  slug: string;
  title: string;
  emoji: string;
};

export function AchievementToast({
  achievements,
  onDone,
}: {
  achievements: AchievementInfo[];
  onDone: () => void;
}) {
  const [current, setCurrent] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (current >= achievements.length) {
      onDone();
      return;
    }
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => setCurrent((c) => c + 1), 400);
    }, 3000);
    return () => clearTimeout(timer);
  }, [current, achievements.length, onDone]);

  if (current >= achievements.length) return null;

  const a = achievements[current];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 pointer-events-none">
      <div
        className="pointer-events-auto rounded-2xl border border-[color:var(--or)] bg-[color:var(--s1)] px-6 py-4 shadow-2xl transition-all duration-400"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0) scale(1)" : "translateY(-20px) scale(0.9)",
          boxShadow: "0 0 40px rgba(255,85,0,0.3)",
        }}
      >
        <div className="text-center">
          <div className="animate-bounce text-5xl">{a.emoji}</div>
          <div className="mt-2 font-[family-name:var(--font-condensed)] text-[10px] font-bold uppercase tracking-[2px] text-[color:var(--or)]">
            Conquista Desbloqueada!
          </div>
          <div className="mt-1 font-[family-name:var(--font-display)] text-lg tracking-wider">
            {a.title}
          </div>
        </div>
      </div>
    </div>
  );
}
