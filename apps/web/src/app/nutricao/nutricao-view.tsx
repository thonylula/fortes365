"use client";

import { useMemo, useState } from "react";
import { NavTabs } from "@/components/nav-tabs";
import { PaywallModal } from "@/components/paywall-modal";
import type { SubscriptionInfo } from "@/lib/supabase/guards";
import { getFruitsForMonth } from "@/lib/regional-fruits";
import {
  calculateMacros,
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
    ptl: string; // deprecado: kcal agora computado via sumNutrition do foods.ts
    ptj: string; // deprecado: idem
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

  // Resumo nutricional cientifico: soma kcal+macros de todos os items
  // do dia (já personalizados) e compara com a meta calculada do user.
  // Só roda se temos foods cadastrados e perfil científico preenchido.
  // Defensive: meal.data.items pode ser null/undefined em rows malformadas
  // do plan_meals — evita crash da arvore inteira.
  const dailyNutrition = useMemo(() => {
    if (!foods || foods.length === 0 || !userMetrics) return null;
    const allItems: string[] = [];
    for (const meal of dayMeals) {
      const items = meal.data?.items;
      if (!Array.isArray(items)) continue;
      for (const item of items) {
        if (typeof item !== "string") continue;
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

        {/* Resumo nutricional do dia.
            3 estados: card cientifico completo, prompt de perfil, ou aviso de banco vazio.
            NUNCA mostramos kcal sem base em forte_foods (TACO/USDA/Embrapa). */}
        {dailyNutrition && dailyTarget ? (
          <DailyNutritionCard actual={dailyNutrition} target={dailyTarget} />
        ) : !userMetrics ? (
          <div className="mb-4 rounded-xl border border-dashed border-[color:var(--bd)] bg-[color:var(--s1)] p-5 text-center">
            <div className="font-[family-name:var(--font-condensed)] text-[10px] font-bold uppercase tracking-[2px] text-[color:var(--tx3)]">
              Resumo nutricional
            </div>
            <p className="mt-2 text-xs leading-relaxed text-[color:var(--tx2)]">
              <a href="/conta" className="text-[color:var(--or)] underline">
                Complete seu perfil científico
              </a>{" "}
              pra calcular suas calorias e macros do dia (Mifflin-St Jeor + ISSN 2017).
            </p>
          </div>
        ) : (
          <NoFoodsCard target={dailyTarget!} />
        )}

        {/* Meal cards */}
        <div key={`${monthId}-${weekIndex}-${dayIndex}`} className="animate-in flex flex-col gap-[7px]">
          {dayMeals.map((meal) => (
            <MealCard
              key={meal.slot_key}
              meal={meal}
              userInitial={userInitial}
              userMetrics={userMetrics}
              foods={foods}
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
  foods,
}: {
  meal: MealRow;
  userInitial?: string | null;
  userMetrics?: UserMetrics | null;
  foods?: Food[];
}) {
  const d = meal.data ?? ({} as MealRow["data"]);
  const hasRecipe = (meal.slot_key === "alm" || meal.slot_key === "jan") && !!d.rec;
  const baseClass =
    "block overflow-hidden rounded-xl border border-[color:var(--bd)] bg-[color:var(--s1)] transition-all";
  const interactiveClass = hasRecipe
    ? " hover:-translate-y-0.5 hover:border-[color:var(--or)] hover:shadow-md hover:shadow-black/20 cursor-pointer"
    : " hover:border-[color:var(--or)]/40 hover:shadow-md hover:shadow-black/20";

  // Defensive: d.items pode vir null/undefined ou nao-array em rows
  // malformadas — fallback pra array vazio em vez de crash.
  const safeItems: string[] = Array.isArray(d.items)
    ? d.items.filter((it): it is string => typeof it === "string")
    : [];
  const personalizedItems = userMetrics
    ? safeItems.map((it) => personalizeMealItem(it, userMetrics, userInitial))
    : safeItems;

  // Kcal/macros CIENTIFICOS via sumNutrition contra forte_foods (TACO/USDA/Embrapa).
  // NUNCA usamos data.ptl (chute do seed) como fonte de número exibido.
  const mealNutrition = useMemo(() => {
    if (!foods || foods.length === 0 || !userMetrics) return null;
    return sumNutrition(personalizedItems, foods);
  }, [foods, userMetrics, personalizedItems]);

  const coverage =
    mealNutrition && mealNutrition.total > 0
      ? mealNutrition.matched / mealNutrition.total
      : 0;
  const showFull = !!mealNutrition && coverage >= 0.7;
  const showPartial = !!mealNutrition && coverage >= 0.3 && coverage < 0.7;

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
        {(showFull || showPartial || hasRecipe) && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {showFull && mealNutrition && (
              <span
                className="rounded-sm px-2 py-0.5 font-[family-name:var(--font-condensed)] text-[10px] font-semibold"
                style={{ background: "var(--ord)", color: "var(--or)" }}
              >
                Porção: {mealNutrition.kcal} kcal · P {Math.round(mealNutrition.protein_g)}g · C {Math.round(mealNutrition.carb_g)}g · G {Math.round(mealNutrition.fat_g)}g
              </span>
            )}
            {showPartial && mealNutrition && (
              <span
                className="rounded-sm px-2 py-0.5 font-[family-name:var(--font-condensed)] text-[10px] font-semibold"
                style={{ background: "var(--ord)", color: "var(--or)" }}
                title={`Estimativa parcial — ${mealNutrition.matched} de ${mealNutrition.total} ingredientes na tabela TACO/USDA/Embrapa`}
              >
                ~{mealNutrition.kcal} kcal
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
// NoFoodsCard
// Renderizado quando user tem perfil cientifico mas forte_foods está vazia
// (migration 0035 não aplicada). Mostra a meta diária pra contexto e pede
// apoio admin pra popular o banco. Honesto > falso.
// ──────────────────────────────────────────────────────────────────────────
function NoFoodsCard({ target }: { target: Macros }) {
  return (
    <div className="mb-4 overflow-hidden rounded-xl border border-[color:var(--bd)] bg-[color:var(--s1)]">
      <div className="border-b border-[color:var(--bd)] bg-black/20 px-4 py-2">
        <div className="font-[family-name:var(--font-condensed)] text-[10px] font-bold uppercase tracking-[2px] text-[color:var(--tx2)]">
          ⚠ Banco nutricional indisponível
        </div>
      </div>
      <div className="p-4">
        <p className="mb-3 text-[12px] leading-relaxed text-[color:var(--tx3)]">
          Tabela de alimentos (TACO 4ª ed · USDA · Embrapa) não está populada
          em produção. Sem ela, não calculamos kcal/macros reais das refeições —
          preferimos não mostrar a chute.
        </p>
        <div className="rounded-md border border-[color:var(--or)]/30 bg-[color:var(--ord)] p-3">
          <div className="font-[family-name:var(--font-condensed)] text-[10px] font-bold uppercase tracking-[1.5px] text-[color:var(--or)]">
            Sua meta diária (calculada do seu perfil)
          </div>
          <div className="mt-1 font-[family-name:var(--font-mono)] text-sm text-[color:var(--tx)]">
            {target.kcal} kcal · P {target.protein_g}g · C {target.carb_g}g · G {target.fat_g}g
          </div>
        </div>
      </div>
    </div>
  );
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
            ℹ️ Alguns itens ainda não estão no banco. Os totais somam apenas alimentos com macros conhecidos.
          </p>
        )}

        <p className="mt-3 border-t border-white/5 pt-2 text-[10px] leading-relaxed text-[color:var(--tx3)]">
          Macros calculados com{" "}
          <span className="text-[color:var(--tx2)]">TACO 4ª ed (NEPA-Unicamp)</span>
          {" · "}
          <span className="text-[color:var(--tx2)]">USDA FoodData Central</span>
          {" · "}
          <a
            href="https://world.openfoodfacts.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[color:var(--or)] underline underline-offset-2 hover:opacity-80"
          >
            Open Food Facts
          </a>
        </p>
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
