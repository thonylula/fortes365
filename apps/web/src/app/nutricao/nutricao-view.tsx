"use client";

import { useMemo, useState } from "react";
import { NavTabs } from "@/components/nav-tabs";
import { PaywallModal } from "@/components/paywall-modal";
import type { SubscriptionInfo } from "@/lib/supabase/guards";
import { getFruitsForMonth } from "@/lib/regional-fruits";
import {
  calculateMacros,
  personalizeKcal,
  personalizeMealItem,
  type UserMetrics,
} from "@/lib/macros";
import { sumNutrition, type Food } from "@/lib/foods";

type Month = { id: number; short_name: string; name: string; season: string };
type MealRow = {
  month_id: number;
  week_index: number;
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

const REGION_LABEL: Record<string, string> = {
  nordeste: "Nordeste",
  sudeste: "Sudeste",
  sul: "Sul",
  norte: "Norte",
  centro_oeste: "Centro-Oeste",
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

export function NutricaoView({
  months,
  meals,
  subInfo,
  userRegion,
  effectiveRegion,
  hasRegion,
  regionSupported,
  userInitial,
  userMetrics,
  foods,
}: {
  months: Month[];
  meals: MealRow[];
  subInfo: SubscriptionInfo;
  userRegion: string | null;
  effectiveRegion: string;
  hasRegion: boolean;
  regionSupported: boolean;
  userInitial?: string | null;
  userMetrics?: UserMetrics | null;
  foods?: Food[];
}) {
  const [monthId, setMonthId] = useState(0);
  const [weekIndex, setWeekIndex] = useState(0);
  const [dayIndex, setDayIndex] = useState(0);
  const [showPaywall, setShowPaywall] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const freeSet = new Set(subInfo.freeMonths);

  const month = months.find((m) => m.id === monthId) ?? months[0];

  const dayMeals = useMemo(
    () =>
      meals
        .filter(
          (m) =>
            m.month_id === monthId &&
            m.week_index === weekIndex &&
            m.day_index === dayIndex,
        )
        .sort((a, b) => SLOT_ORDER.indexOf(a.slot_key) - SLOT_ORDER.indexOf(b.slot_key)),
    [meals, monthId, weekIndex, dayIndex],
  );

  const showRegionBanner =
    !bannerDismissed && (!hasRegion || !regionSupported);
  const bannerMessage = !hasRegion
    ? "Personalize seu card\u00e1pio: complete seu perfil para receber receitas da sua regi\u00e3o."
    : `Card\u00e1pio ${REGION_LABEL[userRegion ?? ""] ?? ""} em breve \u2014 por enquanto mostramos o ${REGION_LABEL[effectiveRegion] ?? effectiveRegion}.`;

  const totalKcal = dayMeals.reduce((sum, m) => {
    const ptlPersonalized = userMetrics
      ? personalizeKcal(m.data.ptl ?? "", userMetrics)
      : (m.data.ptl ?? "");
    const v = parseInt(ptlPersonalized.replace(/[^0-9]/g, "") || "0");
    return sum + (isNaN(v) ? 0 : v);
  }, 0);

  // Resumo nutricional cientifico: soma kcal+macros de todos os items
  // do dia (já personalizados) e compara com a meta calculada do user.
  // Só roda se temos foods cadastrados e perfil científico preenchido.
  const dailyNutrition = useMemo(() => {
    if (!foods || foods.length === 0 || !userMetrics) return null;
    const allItems: string[] = [];
    for (const meal of dayMeals) {
      for (const item of meal.data.items) {
        allItems.push(personalizeMealItem(item, userMetrics, userInitial));
      }
    }
    return sumNutrition(allItems, foods);
  }, [dayMeals, foods, userMetrics, userInitial]);

  const dailyTarget = userMetrics ? calculateMacros(userMetrics) : null;

  return (
    <>
      <NavTabs />

      {showPaywall && (
        <PaywallModal isLoggedIn={subInfo.isLoggedIn} onClose={() => setShowPaywall(false)} />
      )}

      {showRegionBanner && (
        <div className="flex items-start gap-2 border-b border-[color:var(--or)]/40 bg-[color:var(--ord)] px-3 py-2 text-xs text-[color:var(--tx1)]">
          <span className="mt-0.5 text-sm leading-none">🧭</span>
          <p className="flex-1 leading-snug">
            {bannerMessage}
            {!hasRegion && (
              <>
                {" "}
                <a href="/onboarding" className="font-semibold text-[color:var(--or)] underline underline-offset-2">
                  Completar perfil
                </a>
              </>
            )}
          </p>
          <button
            type="button"
            aria-label="Fechar aviso"
            onClick={() => setBannerDismissed(true)}
            className="shrink-0 text-[color:var(--tx3)] hover:text-[color:var(--tx1)]"
          >
            ×
          </button>
        </div>
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
            <p className="text-xs text-[color:var(--tx3)]">
              <span className="font-[family-name:var(--font-condensed)] uppercase tracking-[1.5px] text-[color:var(--or)]">
                Frutas do mês:
              </span>{" "}
              {getFruitsForMonth(effectiveRegion, month.id)}
            </p>
          </div>
        </div>

        {/* Resumo nutricional cientifico do dia */}
        {dailyNutrition && dailyTarget ? (
          <DailyNutritionCard
            actual={dailyNutrition}
            target={dailyTarget}
          />
        ) : (
          <div className="mb-4">
            <div className="ks-box">
              <div className="ks-v" style={{ color: "var(--or)" }}>{totalKcal}</div>
              <div className="ks-l">Kcal do dia</div>
            </div>
            {!userMetrics && (
              <p className="mt-2 text-center text-[10px] text-[color:var(--tx3)]">
                <a href="/conta" className="text-[color:var(--or)] underline">
                  Complete seu perfil científico
                </a>{" "}
                para ver macros personalizados.
              </p>
            )}
          </div>
        )}

        {/* Meal cards */}
        <div key={`${monthId}-${weekIndex}-${dayIndex}`} className="animate-in flex flex-col gap-[7px]">
          {dayMeals.map((meal) => (
            <MealCard
              key={meal.slot_key}
              meal={meal}
              userInitial={userInitial}
              userMetrics={userMetrics}
            />
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

function MealCard({
  meal,
  userInitial,
  userMetrics,
}: {
  meal: MealRow;
  userInitial?: string | null;
  userMetrics?: UserMetrics | null;
}) {
  const d = meal.data;
  const hasRecipe = (meal.slot_key === "alm" || meal.slot_key === "jan") && !!d.rec;
  const baseClass =
    "block overflow-hidden rounded-xl border border-[color:var(--bd)] bg-[color:var(--s1)] transition-all";
  const interactiveClass = hasRecipe
    ? " hover:-translate-y-0.5 hover:border-[color:var(--or)] hover:shadow-md hover:shadow-black/20 cursor-pointer"
    : " hover:border-[color:var(--or)]/40 hover:shadow-md hover:shadow-black/20";

  const personalizedItems = userMetrics
    ? d.items.map((it) => personalizeMealItem(it, userMetrics, userInitial))
    : d.items;
  const personalizedPtl =
    d.ptl && userMetrics ? personalizeKcal(d.ptl, userMetrics) : d.ptl;

  const inner = (
    <>
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
        {personalizedItems.map((item, i) => (
          <div key={i} className="flex gap-1.5 text-[12px] leading-relaxed text-[color:var(--tx2)]">
            <span className="text-[color:var(--tx3)]">•</span>
            <span>{item}</span>
          </div>
        ))}
        {(personalizedPtl || hasRecipe) && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {personalizedPtl && (
              <span
                className="rounded-sm px-2 py-0.5 font-[family-name:var(--font-condensed)] text-[10px] font-semibold"
                style={{ background: "var(--ord)", color: "var(--or)" }}
              >
                Porção: {personalizedPtl}
              </span>
            )}
            {hasRecipe && (
              <span
                className="rounded-sm px-2 py-0.5 font-[family-name:var(--font-condensed)] text-[10px] font-semibold"
                style={{ background: "var(--ord)", color: "var(--or)" }}
              >
                📖 Ver receita
              </span>
            )}
          </div>
        )}
      </div>
    </>
  );

  if (hasRecipe) {
    return (
      <a href={`/receitas?slug=${encodeURIComponent(d.rec!)}`} className={baseClass + interactiveClass}>
        {inner}
      </a>
    );
  }
  return <div className={baseClass + interactiveClass}>{inner}</div>;
}

// ──────────────────────────────────────────────────────────────────────────
// DailyNutritionCard
// Soma kcal+P/C/G de todas as refeições do dia (já personalizadas) e
// compara com a meta calculada a partir do perfil científico do user.
// ──────────────────────────────────────────────────────────────────────────
type Macros = { kcal: number; protein_g: number; carb_g: number; fat_g: number };
type DailyTotals = Macros & { matched: number; total: number };

function DailyNutritionCard({
  actual,
  target,
}: {
  actual: DailyTotals;
  target: Macros;
}) {
  const kcalPct = Math.min(150, Math.round((actual.kcal / target.kcal) * 100));
  const proteinPct = Math.min(150, Math.round((actual.protein_g / target.protein_g) * 100));
  const carbPct = Math.min(150, Math.round((actual.carb_g / target.carb_g) * 100));
  const fatPct = Math.min(150, Math.round((actual.fat_g / target.fat_g) * 100));

  const coverage = actual.total > 0 ? Math.round((actual.matched / actual.total) * 100) : 0;

  return (
    <div className="mb-4 overflow-hidden rounded-xl border border-[color:var(--or)]/30 bg-gradient-to-br from-[color:var(--ord)] to-[color:var(--s1)]">
      <div className="border-b border-[color:var(--or)]/20 bg-black/20 px-4 py-2">
        <div className="flex items-baseline justify-between gap-2">
          <div className="font-[family-name:var(--font-condensed)] text-[10px] font-bold uppercase tracking-[2px] text-[color:var(--or)]">
            Resumo nutricional do dia
          </div>
          <div className="font-[family-name:var(--font-condensed)] text-[9px] uppercase tracking-[1.5px] text-[color:var(--tx3)]">
            {actual.matched}/{actual.total} alimentos · {coverage}% rastreado
          </div>
        </div>
      </div>

      <div className="p-4">
        {/* Kcal destaque */}
        <div className="mb-3">
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-2">
              <span className="font-[family-name:var(--font-display)] text-4xl leading-none text-[color:var(--or)]">
                {actual.kcal}
              </span>
              <span className="font-[family-name:var(--font-mono)] text-sm text-[color:var(--tx3)]">
                / {target.kcal} kcal
              </span>
            </div>
            <span
              className="font-[family-name:var(--font-mono)] text-sm font-bold"
              style={{ color: pctColor(kcalPct) }}
            >
              {kcalPct}%
            </span>
          </div>
          <ProgressBar pct={kcalPct} color="var(--or)" />
        </div>

        {/* Macros */}
        <div className="grid grid-cols-3 gap-2">
          <MacroProgress
            label="Proteína"
            actual={actual.protein_g}
            target={target.protein_g}
            pct={proteinPct}
            color="var(--or)"
          />
          <MacroProgress
            label="Carbo"
            actual={actual.carb_g}
            target={target.carb_g}
            pct={carbPct}
            color="var(--gn)"
          />
          <MacroProgress
            label="Gordura"
            actual={actual.fat_g}
            target={target.fat_g}
            pct={fatPct}
            color="#facc15"
          />
        </div>

        {coverage < 100 && coverage > 0 && (
          <p className="mt-3 text-[10px] leading-relaxed text-[color:var(--tx3)]">
            ℹ️ Alguns itens não estão na tabela nutricional (TACO/USDA/Embrapa).
            Os totais somam apenas alimentos com macros conhecidos.
          </p>
        )}
      </div>
    </div>
  );
}

function MacroProgress({
  label,
  actual,
  target,
  pct,
  color,
}: {
  label: string;
  actual: number;
  target: number;
  pct: number;
  color: string;
}) {
  return (
    <div
      className="rounded-md border bg-black/20 px-3 py-2"
      style={{ borderColor: `${color}33` }}
    >
      <div
        className="font-[family-name:var(--font-condensed)] text-[9px] font-bold uppercase tracking-[2px]"
        style={{ color }}
      >
        {label}
      </div>
      <div className="mt-1 flex items-baseline gap-1">
        <span
          className="font-[family-name:var(--font-display)] text-xl leading-none"
          style={{ color }}
        >
          {Math.round(actual)}
        </span>
        <span className="font-[family-name:var(--font-mono)] text-[10px] text-[color:var(--tx3)]">
          /{target}g
        </span>
      </div>
      <div className="mt-1.5">
        <ProgressBar pct={pct} color={color} small />
      </div>
      <div
        className="mt-0.5 text-right font-[family-name:var(--font-mono)] text-[10px] font-bold"
        style={{ color: pctColor(pct) }}
      >
        {pct}%
      </div>
    </div>
  );
}

function ProgressBar({
  pct,
  color,
  small,
}: {
  pct: number;
  color: string;
  small?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-full bg-[color:var(--s2)]`}
      style={{ height: small ? 3 : 6 }}
    >
      <div
        className="h-full rounded-full transition-all"
        style={{
          width: `${Math.min(100, pct)}%`,
          background: pct > 110 ? "#ef4444" : color,
          boxShadow: `0 0 8px ${color}88`,
        }}
      />
    </div>
  );
}

/**
 * Cor do badge de % conforme zona:
 * - <80%: laranja claro (faltando)
 * - 80-110%: verde (na meta)
 * - >110%: vermelho (estourado)
 */
function pctColor(pct: number): string {
  if (pct < 80) return "var(--tx2)";
  if (pct <= 110) return "var(--gn)";
  return "#ef4444";
}
