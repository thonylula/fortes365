"use client";

import { useState } from "react";

export function AchievementCard({
  emoji,
  title,
  description,
  unlocked,
  unlockedAt,
}: {
  emoji: string;
  title: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: string;
}) {
  const [shared, setShared] = useState(false);

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = `Desbloqueei ${emoji} ${title} no FORTE 365!`;
    const url = "https://fortes365.vercel.app";
    try {
      if (navigator.share) {
        await navigator.share({ title: "FORTE 365", text, url });
      } else {
        await navigator.clipboard.writeText(`${text} ${url}`);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      }
    } catch { /* user cancelled */ }
  };

  return (
    <div
      className="relative rounded-xl border p-4 text-center transition-all"
      style={{
        borderColor: unlocked ? "var(--or)" : "var(--bd)",
        background: unlocked ? "var(--ord)" : "var(--s1)",
        opacity: unlocked ? 1 : 0.5,
      }}
    >
      {unlocked && (
        <button
          onClick={handleShare}
          className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[color:var(--s1)]/80 text-xs text-[color:var(--or)] transition-colors hover:bg-[color:var(--or)] hover:text-black"
          aria-label="Compartilhar conquista"
          title="Compartilhar"
        >
          {shared ? "✓" : "↗"}
        </button>
      )}
      <div className="text-3xl">{emoji}</div>
      <div className="mt-1 font-[family-name:var(--font-condensed)] text-xs font-bold uppercase tracking-wider">
        {title}
      </div>
      <div className="mt-1 text-[10px] leading-tight text-[color:var(--tx3)]">
        {description}
      </div>
      {unlocked && unlockedAt && (
        <div className="mt-2 text-[9px] text-[color:var(--gn)]">
          ✓ {new Date(unlockedAt).toLocaleDateString("pt-BR")}
        </div>
      )}
      {!unlocked && (
        <div className="mt-2 text-[9px] text-[color:var(--tx3)]">
          🔒 Bloqueada
        </div>
      )}
    </div>
  );
}
