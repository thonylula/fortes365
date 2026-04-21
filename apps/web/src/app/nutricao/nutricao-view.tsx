"use client";

import { useMemo, useState } from "react";
import { NavTabs } from "@/components/nav-tabs";
import { PaywallModal } from "@/components/paywall-modal";
import type { SubscriptionInfo } from "@/lib/supabase/guards";

type Month = { id: number; short_name: string; name: string; season: string };
type MealRow = {
  month_id: number;
  day_index: number;
  slot_key: string;
  data: {
    t: string;
    ico: string;
    time: string;
    items: string[];
    ptl: string;
    ptj: string;
    rec: string | null;
  };
};

const DAY_SHORT = ["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"];
const SLOT_ORDER = ["cafe", "lm", "alm", "pre", "pos", "jan", "ln"];
const SLOT_BG: Record<string, string> = {
  cafe: "var(--ywd)",
  lm: "var(--pud)",
  alm: "var(--gnd)",
  pre: "var(--ord)",
  pos: "var(--bld)",
  jan: "rgba(59,130,246,.1)",
  ln: "rgba(34,197,94,.1)",
};

export function NutricaoView({ months, meals, subInfo }: { months: Month[]; meals: MealRow[]; subInfo: SubscriptionInfo }) {
  const [monthId, setMonthId] = useState(0);
  const [weekIndex, setWeekIndex] = useState(0);
  const [dayIndex, setDayIndex] = useState(0);
  const [showPaywall, setShowPaywall] = useState(false);
  const freeSet = new Set(subInfo.freeMonths);

  const month = months.find((m) => m.id === monthId) ?? months[0];

  const dayMeals = useMemo(
    () =>
      meals
        .filter((m) => m.month_id === monthId && m.day_index === dayIndex)
        .sort((a, b) => SLOT_ORDER.indexOf(a.slot_key) - SLOT_ORDER.indexOf(b.slot_key)),
    [meals, monthId, dayIndex],
  );

  const totalKcal = dayMeals.reduce((sum, m) => {
    const v = parseInt(m.data.ptl?.replace(/[^0-9]/g, "") ?? "0");
    return sum + (isNaN(v) ? 0 : v);
  }, 0);

  return (
    <>
      <NavTabs />

      {showPaywall && (
        <PaywallModal isLoggedIn={subInfo.isLoggedIn} onClose={() => setShowPaywall(false)} />
      )}

      {/* Month strip */}
      <div className="border-b border-[color:var(--bd)] bg-[color:var(--s2)] px-3 py-2 overflow-x-auto">
        <div className="flex min-w-max gap-[5px]">
          {months.map((m) => {
            const locked = !subInfo.isPremium && !freeSet.has(m.id);
            return (
              <button
                key={m.id}
                className="chipbtn"
                data-active={m.id === monthId}
                style={locked ? { opacity: 0.5 } : undefined}
                onClick={() => {
                  if (locked) { setShowPaywall(true); return; }
                  setMonthId(m.id); setWeekIndex(0); setDayIndex(0);
                }}
              >
                {locked ? "🔒 " : ""}{m.short_name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Week strip */}
      <div className="flex items-center gap-3 overflow-x-auto border-b border-[color:var(--bd)] bg-[color:var(--bg)] px-3 py-2">
        <span className="shrink-0 text-[10px] uppercase tracking-[1.5px] text-[color:var(--tx3)]">
          Semana:
        </span>
        <div className="flex shrink-0 gap-[5px]">
          {[0, 1, 2, 3].map((w) => (
            <button
              key={w}
              className="chipbtn"
              data-active={w === weekIndex}
              onClick={() => setWeekIndex(w)}
            >
              Sem {w + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Day strip */}
      <div className="border-b border-[color:var(--bd)] bg-[color:var(--s1)] px-3 py-2 overflow-x-auto">
        <div className="flex min-w-max gap-[5px]">
          {DAY_SHORT.map((label, i) => (
            <button
              key={i}
              className="daybtn"
              data-active={i === dayIndex}
              onClick={() => setDayIndex(i)}
            >
              <span className="da">{label}</span>
            </button>
          ))}
        </div>
      </div>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-5 pb-20">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-xl tracking-wider">
              {month.name} · {DAY_SHORT[dayIndex]}
            </h1>
            <p className="text-xs text-[color:var(--tx3)]">{month.season}</p>
          </div>
        </div>

        {/* Calorie summary */}
        <div className="mb-4">
          <div className="ks-box">
            <div className="ks-v" style={{ color: "var(--or)" }}>{totalKcal}</div>
            <div className="ks-l">Kcal do dia</div>
          </div>
        </div>

        {/* Meal cards */}
        <div key={`${monthId}-${weekIndex}-${dayIndex}`} className="animate-in flex flex-col gap-[7px]">
          {dayMeals.map((meal) => (
            <MealCard key={meal.slot_key} meal={meal} />
          ))}
        </div>

        {dayMeals.length === 0 && (
          <div className="rounded-xl border border-[color:var(--bd)] bg-[color:var(--s1)] px-6 py-10 text-center">
            <div className="mb-3 text-4xl">🍽</div>
            <h3 className="mb-1 font-[family-name:var(--font-display)] text-lg tracking-wider">SEM REFEICOES</h3>
            <p className="text-sm text-[color:var(--tx2)]">Nenhuma refeicao cadastrada para este dia.</p>
          </div>
        )}
      </main>
    </>
  );
}

function MealCard({ meal }: { meal: MealRow }) {
  const d = meal.data;
  return (
    <div className="overflow-hidden rounded-xl border border-[color:var(--bd)] bg-[color:var(--s1)] transition-all hover:border-[color:var(--or)]/40 hover:shadow-md hover:shadow-black/20">
      <div className="flex items-center gap-2 border-b border-[color:var(--bd)] bg-[color:var(--s2)] px-3 py-2">
        <span
          className="flex h-[26px] w-[26px] items-center justify-center rounded-md text-[13px]"
          style={{ background: SLOT_BG[meal.slot_key] ?? "var(--s3)" }}
        >
          {d.ico}
        </span>
        <span className="flex-1 font-[family-name:var(--font-condensed)] text-[12px] font-bold uppercase tracking-[1px]">
          {d.t}
        </span>
        <span className="rounded-sm bg-[color:var(--s3)] px-1.5 py-0.5 font-[family-name:var(--font-condensed)] text-[10px] font-semibold text-[color:var(--tx2)]">
          {d.time}
        </span>
      </div>
      <div className="px-3 py-2.5">
        {d.items.map((item, i) => (
          <div key={i} className="flex gap-1.5 text-[12px] leading-relaxed text-[color:var(--tx2)]">
            <span className="text-[color:var(--tx3)]">•</span>
            <span>{item}</span>
          </div>
        ))}
        {d.ptl && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="rounded-sm px-2 py-0.5 font-[family-name:var(--font-condensed)] text-[10px] font-semibold" style={{ background: "var(--ord)", color: "var(--or)" }}>
              Porção: {d.ptl}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
