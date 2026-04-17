"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { createClient } from "@supabase/supabase-js";
import type { LeaderboardEntry } from "./page";

const METRICS = [
  { key: "xp", label: "XP", field: "total_xp" as const },
  { key: "streak", label: "Streak", field: "longest_streak" as const },
  { key: "workouts", label: "Treinos", field: "workout_count" as const },
  { key: "skills", label: "Skills", field: "skill_count" as const },
] as const;

const REGIONS = [
  { key: null, label: "Todas" },
  { key: "nordeste", label: "NE" },
  { key: "sudeste", label: "SE" },
  { key: "sul", label: "S" },
  { key: "norte", label: "N" },
  { key: "centro_oeste", label: "CO" },
] as const;

const PODIUM_EMOJI = ["🥇", "🥈", "🥉"];
const PODIUM_COLORS = ["var(--or)", "var(--tx2)", "#cd7f32"];
const FITNESS_LABELS = ["Inic.", "Bas.", "Inter.", "Avanc."];

export function LeaderboardView({
  initialEntries,
  currentUserId,
  initialMyRank,
}: {
  initialEntries: LeaderboardEntry[];
  currentUserId: string | null;
  initialMyRank: number | null;
}) {
  const [entries, setEntries] = useState(initialEntries);
  const [metric, setMetric] = useState("xp");
  const [region, setRegion] = useState<string | null>(null);
  const [myRank, setMyRank] = useState(initialMyRank);
  const [isPending, startTransition] = useTransition();

  const fetchLeaderboard = (newMetric: string, newRegion: string | null) => {
    startTransition(async () => {
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        );
        const { data } = await supabase.rpc("get_leaderboard", {
          metric: newMetric,
          region_filter: newRegion,
          page_size: 50,
          page_offset: 0,
        });
        setEntries((data ?? []) as LeaderboardEntry[]);

        if (currentUserId) {
          const { data: rankData } = await supabase.rpc("get_my_rank", { metric: newMetric });
          setMyRank(rankData as number | null);
        }
      } catch { /* RPC not available */ }
    });
  };

  const activeMetric = METRICS.find((m) => m.key === metric) ?? METRICS[0];
  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  const getValue = (entry: LeaderboardEntry) => entry[activeMetric.field];

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 pb-20" id="main-content">
      <h1 className="mb-4 text-center font-[family-name:var(--font-display)] text-3xl tracking-wider">
        RANKING
      </h1>

      {/* Metric tabs */}
      <div className="mb-3 flex justify-center gap-1.5">
        {METRICS.map((m) => (
          <button
            key={m.key}
            onClick={() => { setMetric(m.key); fetchLeaderboard(m.key, region); }}
            className="rounded-full px-3.5 py-1.5 font-[family-name:var(--font-condensed)] text-[10px] font-bold uppercase tracking-wider transition-all"
            style={{
              background: metric === m.key ? "var(--or)" : "var(--s2)",
              color: metric === m.key ? "#000" : "var(--tx2)",
              border: `1.5px solid ${metric === m.key ? "var(--or)" : "var(--bd)"}`,
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Region filter */}
      <div className="mb-6 flex justify-center gap-1">
        {REGIONS.map((r) => (
          <button
            key={r.key ?? "all"}
            onClick={() => { setRegion(r.key); fetchLeaderboard(metric, r.key); }}
            className="rounded-md px-2 py-1 font-[family-name:var(--font-condensed)] text-[9px] font-bold uppercase tracking-wider transition-all"
            style={{
              background: region === r.key ? "var(--s3)" : "transparent",
              color: region === r.key ? "var(--tx)" : "var(--tx3)",
            }}
          >
            {r.label}
          </button>
        ))}
      </div>

      {isPending && (
        <div className="mb-4 text-center text-xs text-[color:var(--tx3)]">Carregando...</div>
      )}

      {/* Podio top 3 */}
      {top3.length > 0 && (
        <div className="mb-6 flex items-end justify-center gap-3">
          {[1, 0, 2].map((pos) => {
            const entry = top3[pos];
            if (!entry) return <div key={pos} className="w-20" />;
            const isMe = entry.user_id === currentUserId;
            return (
              <Link
                key={entry.user_id}
                href={`/perfil/${entry.user_id}`}
                className="flex flex-col items-center transition-transform hover:scale-105"
              >
                <div className="text-2xl">{PODIUM_EMOJI[pos]}</div>
                <div
                  className="mb-1 flex h-12 w-12 items-center justify-center rounded-full font-[family-name:var(--font-display)] text-lg"
                  style={{
                    background: `color-mix(in srgb, ${PODIUM_COLORS[pos]} 15%, var(--s1))`,
                    border: `2px solid ${PODIUM_COLORS[pos]}`,
                    color: PODIUM_COLORS[pos],
                  }}
                >
                  {(entry.display_name ?? "?").charAt(0).toUpperCase()}
                </div>
                <div className={`max-w-[80px] truncate text-center text-[11px] font-semibold ${isMe ? "text-[color:var(--or)]" : ""}`}>
                  {entry.display_name ?? "Anon"}
                </div>
                <div className="font-[family-name:var(--font-display)] text-lg tracking-wider" style={{ color: PODIUM_COLORS[pos] }}>
                  {getValue(entry).toLocaleString("pt-BR")}
                </div>
                <div
                  className="mt-1 rounded-full px-4 py-1"
                  style={{
                    height: pos === 0 ? 48 : pos === 1 ? 32 : 20,
                    background: `color-mix(in srgb, ${PODIUM_COLORS[pos]} 20%, var(--s2))`,
                    border: `1px solid ${PODIUM_COLORS[pos]}`,
                  }}
                />
              </Link>
            );
          })}
        </div>
      )}

      {/* Lista */}
      <div className="space-y-1.5">
        {rest.map((entry) => {
          const isMe = entry.user_id === currentUserId;
          return (
            <Link
              key={entry.user_id}
              href={`/perfil/${entry.user_id}`}
              className="flex items-center gap-3 rounded-xl border px-4 py-3 transition-all hover:border-[color:var(--or)]/40"
              style={{
                borderColor: isMe ? "var(--or)" : "var(--bd)",
                background: isMe ? "var(--ord)" : "var(--s1)",
              }}
            >
              <span className="w-6 text-center font-[family-name:var(--font-display)] text-sm text-[color:var(--tx3)]">
                {entry.rank}
              </span>
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-[family-name:var(--font-display)] text-xs"
                style={{ background: "var(--s2)", border: "1.5px solid var(--bd)", color: "var(--tx2)" }}
              >
                {(entry.display_name ?? "?").charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`truncate text-sm font-semibold ${isMe ? "text-[color:var(--or)]" : ""}`}>
                  {entry.display_name ?? "Anon"} {isMe && "(voce)"}
                </div>
                <div className="flex gap-2 text-[9px] text-[color:var(--tx3)]">
                  {entry.region && <span>{entry.region.toUpperCase()}</span>}
                  {entry.fitness_level != null && <span>{FITNESS_LABELS[entry.fitness_level]}</span>}
                </div>
              </div>
              <div className="font-[family-name:var(--font-display)] text-lg tracking-wider" style={{ color: isMe ? "var(--or)" : "var(--tx)" }}>
                {getValue(entry).toLocaleString("pt-BR")}
              </div>
            </Link>
          );
        })}
      </div>

      {entries.length === 0 && !isPending && (
        <div className="rounded-xl border border-[color:var(--bd)] bg-[color:var(--s1)] px-6 py-10 text-center">
          <div className="mb-3 text-4xl">🏅</div>
          <h3 className="mb-1 font-[family-name:var(--font-display)] text-lg tracking-wider">SEM DADOS</h3>
          <p className="text-sm text-[color:var(--tx2)]">Nenhum usuario encontrado para este filtro.</p>
        </div>
      )}

      {/* Minha posicao (sticky bottom) */}
      {myRank != null && currentUserId && (
        <div className="fixed bottom-16 left-1/2 z-30 -translate-x-1/2 animate-in">
          <div className="flex items-center gap-2 rounded-full border border-[color:var(--or)] bg-[color:var(--s1)] px-4 py-2 shadow-lg shadow-black/40">
            <span className="font-[family-name:var(--font-condensed)] text-[10px] font-bold uppercase tracking-wider text-[color:var(--tx3)]">
              Sua posicao
            </span>
            <span className="font-[family-name:var(--font-display)] text-lg tracking-wider text-[color:var(--or)]">
              #{myRank}
            </span>
          </div>
        </div>
      )}
    </main>
  );
}
