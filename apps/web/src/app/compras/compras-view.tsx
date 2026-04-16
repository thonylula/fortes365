"use client";

import { useMemo, useState } from "react";
import { NavTabs } from "@/components/nav-tabs";

type ShopItem = {
  scope: string;
  month_id: number | null;
  category: string | null;
  name: string;
  amount: string | null;
  raw: { ql?: string; qj?: string; obs?: string } | null;
};
type Month = { id: number; short_name: string; name: string };

export function ComprasView({ items, months }: { items: ShopItem[]; months: Month[] }) {
  const [monthId, setMonthId] = useState(0);
  const month = months.find((m) => m.id === monthId) ?? months[0];

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

      {/* Month strip */}
      <div className="border-b border-[color:var(--bd)] bg-[color:var(--s2)] px-3 py-2 overflow-x-auto">
        <div className="flex min-w-max gap-[5px]">
          {months.map((m) => (
            <button
              key={m.id}
              className="chipbtn"
              data-active={m.id === monthId}
              onClick={() => setMonthId(m.id)}
            >
              {m.short_name}
            </button>
          ))}
        </div>
      </div>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-5 pb-20">
        <h1 className="mb-4 font-[family-name:var(--font-display)] text-xl tracking-wider">
          LISTA DE COMPRAS
        </h1>

        {/* Seasonal */}
        {seasonalItems.length > 0 && (
          <div className="mb-6">
            <div className="slbl mb-2.5">Frutas de {month.name}</div>
            {groupByCategory(seasonalItems).map(([cat, catItems]) => (
              <ShopCategory key={cat} category={cat} items={catItems} />
            ))}
          </div>
        )}

        {/* Base */}
        <div>
          <div className="slbl mb-2.5">Lista base (todo mês)</div>
          {groupByCategory(baseItems).map(([cat, catItems]) => (
            <ShopCategory key={cat} category={cat} items={catItems} />
          ))}
        </div>
      </main>
    </>
  );
}

function ShopCategory({ category, items }: { category: string; items: ShopItem[] }) {
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
        {items.map((item, i) => (
          <div key={i} className="rounded-lg bg-[color:var(--s2)] px-3 py-2">
            <div className="text-[13px] font-semibold">{item.name}</div>
            {item.raw?.ql && (
              <span className="text-[11px] text-[color:var(--or)]">L: {item.raw.ql}</span>
            )}
            {item.raw?.qj && (
              <span className="ml-2 text-[11px] text-[color:var(--pk)]">J: {item.raw.qj}</span>
            )}
            {item.raw?.obs && (
              <div className="mt-0.5 text-[10px] italic text-[color:var(--tx3)]">
                {item.raw.obs}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
