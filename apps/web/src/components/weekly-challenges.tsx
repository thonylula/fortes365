"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

type Challenge = {
  id: number;
  slug: string;
  title: string;
  description: string;
  emoji: string;
  type: string;
  target: number;
  xp_reward: number;
  ends_at: string;
  progress: number;
  completed: boolean;
};

function timeLeft(endsAt: string): string {
  const ms = new Date(endsAt).getTime() - Date.now();
  if (ms <= 0) return "Encerrado";
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  if (days > 0) return `${days}d ${hours}h`;
  const mins = Math.floor((ms % 3600000) / 60000);
  return `${hours}h ${mins}m`;
}

export function WeeklyChallenges() {
  const [challenges, setChallenges] = useState<Challenge[] | null>(null);

  useEffect(() => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    supabase.rpc("get_active_challenges").then(({ data, error }) => {
      if (error) { setChallenges([]); return; }
      setChallenges((data as Challenge[]) ?? []);
    });
  }, []);

  if (challenges === null) return null;
  if (challenges.length === 0) return null;

  return (
    <div className="mb-6 rounded-xl border border-[color:var(--bd)] bg-[color:var(--s1)] p-4">
      <div className="slbl mb-3">Desafios da semana</div>
      <div className="space-y-2">
        {challenges.map((c) => {
          const pct = Math.min(100, (c.progress / c.target) * 100);
          return (
            <div
              key={c.id}
              className="rounded-lg border p-3 transition-all"
              style={{
                borderColor: c.completed ? "var(--gn)" : "var(--bd)",
                background: c.completed ? "color-mix(in srgb, var(--gn) 8%, var(--s2))" : "var(--s2)",
              }}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{c.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-[family-name:var(--font-condensed)] text-xs font-bold uppercase tracking-wider">
                      {c.title}
                    </span>
                    {c.completed && <span className="text-[10px] text-[color:var(--gn)]">✓</span>}
                  </div>
                  <div className="text-[10px] text-[color:var(--tx3)]">{c.description}</div>
                </div>
                <div className="text-right">
                  <div className="font-[family-name:var(--font-display)] text-sm tracking-wider" style={{ color: c.completed ? "var(--gn)" : "var(--or)" }}>
                    +{c.xp_reward} XP
                  </div>
                  <div className="text-[9px] text-[color:var(--tx3)]">{timeLeft(c.ends_at)}</div>
                </div>
              </div>

              {/* Progress */}
              <div className="mt-2 flex items-center gap-2">
                <div className="h-1.5 flex-1 rounded-full bg-[color:var(--s3)]">
                  <div
                    className="h-1.5 rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      background: c.completed ? "var(--gn)" : "linear-gradient(90deg, var(--or), #ff9944)",
                    }}
                  />
                </div>
                <span className="font-[family-name:var(--font-condensed)] text-[10px] font-bold tracking-wider text-[color:var(--tx2)]">
                  {c.progress}/{c.target}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
