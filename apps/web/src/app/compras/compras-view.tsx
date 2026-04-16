"use client";

import { useCallback, useMemo, useState } from "react";
import { NavTabs } from "@/components/nav-tabs";
import { PaywallModal } from "@/components/paywall-modal";
import type { SubscriptionInfo } from "@/lib/supabase/guards";

type ShopItem = {
  scope: string;
  month_id: number | null;
  category: string | null;
  name: string;
  amount: string | null;
  raw: { ql?: string; qj?: string; obs?: string } | null;
};
type Month = { id: number; short_name: string; name: string };

export function ComprasView({ items, months, subInfo }: { items: ShopItem[]; months: Month[]; subInfo: SubscriptionInfo }) {
  const [monthId, setMonthId] = useState(0);
  const [showPaywall, setShowPaywall] = useState(false);
  const [checked, setChecked] = useState<Set<string>>(() => new Set());
  const freeSet = new Set(subInfo.freeMonths);
  const month = months.find((m) => m.id === monthId) ?? months[0];

  const toggleCheck = useCallback((key: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }, []);

  const baseItems = useMemo(
    () => items.filter((i) => i.scope === "base"),
    [items],
  );
  const seasonalItems = useMemo(
    () => items.filter((i) => i.scope === "seasonal" && i.month_id === monthId),
    [items, monthId],
  );

  const groupByCategory = (list: ShopItem[]) => {
    const map = new Map<string, ShopItem[]>();
    for (const item of list) {
      const cat = item.category ?? "Outros";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(item);
    }
    return [...map.entries()];
  };

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
                  setMonthId(m.id);
                }}
              >
                {locked ? "🔒 " : ""}{m.short_name}
              </button>
            );
          })}
        </div>
      </div>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-5 pb-20">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="font-[family-name:var(--font-display)] text-xl tracking-wider">
            LISTA DE COMPRAS
          </h1>
          {checked.size > 0 && (
            <button
              onClick={() => setChecked(new Set())}
              className="rounded-md border border-[color:var(--bd)] px-3 py-1 font-[family-name:var(--font-condensed)] text-[10px] font-bold uppercase tracking-wider text-[color:var(--tx3)] transition-colors hover:border-[color:var(--or)] hover:text-[color:var(--or)]"
            >
              Limpar ({checked.size})
            </button>
          )}
        </div>

        <div key={monthId} className="animate-in">
          {/* Seasonal */}
          {seasonalItems.length > 0 && (
            <div className="mb-6">
              <div className="slbl mb-2.5">Frutas de {month.name}</div>
              {groupByCategory(seasonalItems).map(([cat, catItems]) => (
                <ShopCategory key={cat} category={cat} items={catItems} checked={checked} onToggle={toggleCheck} />
              ))}
            </div>
          )}

          {/* Base */}
          <div>
            <div className="slbl mb-2.5">Lista base (todo mes)</div>
            {groupByCategory(baseItems).map(([cat, catItems]) => (
              <ShopCategory key={cat} category={cat} items={catItems} checked={checked} onToggle={toggleCheck} />
            ))}
          </div>

          {seasonalItems.length === 0 && baseItems.length === 0 && (
            <div className="rounded-xl border border-[color:var(--bd)] bg-[color:var(--s1)] px-6 py-10 text-center">
              <div className="mb-3 text-4xl">🛒</div>
              <h3 className="mb-1 font-[family-name:var(--font-display)] text-lg tracking-wider">LISTA VAZIA</h3>
              <p className="text-sm text-[color:var(--tx2)]">Nenhum item cadastrado para este mes.</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

function ShopCategory({ category, items, checked, onToggle }: { category: string; items: ShopItem[]; checked: Set<string>; onToggle: (key: string) => void }) {
  return (
    <div className="mb-3 overflow-hidden rounded-xl border border-[color:var(--bd)] bg-[color:var(--s1)]">
      <div className="flex items-center gap-2 border-b border-[color:var(--bd)] bg-[color:var(--s2)] px-3 py-2">
        <span className="flex-1 font-[family-name:var(--font-condensed)] text-[13px] font-bold uppercase tracking-[1px]">
          {category}
        </span>
        <span className="rounded-sm bg-[color:var(--s3)] px-2 py-0.5 text-[11px] text-[color:var(--tx2)]">
          {items.length}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-2 p-3 sm:grid-cols-2">
        {items.map((item, i) => {
          const key = `${category}-${item.name}`;
          const isDone = checked.has(key);
          return (
            <button
              key={i}
              onClick={() => onToggle(key)}
              className="flex items-center gap-2.5 rounded-lg bg-[color:var(--s2)] px-3 py-2 text-left transition-all duration-200 hover:border-[color:var(--or)]/40"
              style={{ opacity: isDone ? 0.5 : 1 }}
            >
              <span
                className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200"
                style={{
                  borderColor: isDone ? "var(--gn)" : "var(--bd)",
                  background: isDone ? "var(--gn)" : "transparent",
                }}
              >
                {isDone && <span className="text-[10px] text-black">✓</span>}
              </span>
              <div className="flex-1">
                <div className={`text-[13px] font-semibold ${isDone ? "line-through" : ""}`}>{item.name}</div>
                <div className="flex flex-wrap gap-1">
                  {item.raw?.ql && (
                    <span className="text-[11px] text-[color:var(--or)]">L: {item.raw.ql}</span>
                  )}
                  {item.raw?.qj && (
                    <span className="text-[11px] text-[color:var(--pk)]">J: {item.raw.qj}</span>
                  )}
                </div>
                {item.raw?.obs && (
                  <div className="mt-0.5 text-[10px] italic text-[color:var(--tx3)]">
                    {item.raw.obs}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
