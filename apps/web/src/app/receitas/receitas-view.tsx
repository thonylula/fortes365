"use client";

import { useState } from "react";
import { NavTabs } from "@/components/nav-tabs";

type Recipe = {
  slug: string;
  title: string;
  icon: string | null;
  category: string | null;
  time_label: string | null;
  description: string | null;
  data: {
    ings?: { n: string; a: string }[];
    steps?: string[];
    tip?: string;
    porcao?: { l: string; j: string };
  };
};

export function ReceitasView({ recipes }: { recipes: Recipe[] }) {
  const [selected, setSelected] = useState<Recipe | null>(null);

  return (
    <>
      <NavTabs />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-5 pb-20">
        <h1 className="mb-4 font-[family-name:var(--font-display)] text-xl tracking-wider">
          RECEITAS
        </h1>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {recipes.map((r) => (
            <button
              key={r.slug}
              onClick={() => setSelected(r)}
              className="rounded-xl border border-[color:var(--bd)] bg-[color:var(--s1)] p-4 text-left transition-all hover:-translate-y-0.5 hover:border-[color:var(--or)] hover:shadow-lg hover:shadow-[color:var(--or)]/5"
            >
              <div className="mb-1 text-2xl">{r.icon ?? "🍽"}</div>
              <div className="text-[13px] font-semibold">{r.title}</div>
              <div className="text-[10px] uppercase tracking-wider text-[color:var(--tx2)]">
                {r.category}
              </div>
              <div className="mt-1 text-[10px] text-[color:var(--tx3)]">{r.time_label}</div>
            </button>
          ))}
        </div>
      </main>

      {/* Modal de receita */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={selected.title}
          onClick={() => setSelected(null)}
          onKeyDown={(e) => e.key === "Escape" && setSelected(null)}
        >
          <div
            className="w-full max-w-[660px] max-h-[88vh] overflow-y-auto rounded-t-2xl bg-[color:var(--s1)] p-5 animate-[slideUp_0.22s_ease]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex justify-end">
              <button
                onClick={() => setSelected(null)}
                aria-label="Fechar receita"
                className="rounded-md bg-[color:var(--s3)] px-3 py-1 text-[12px] text-[color:var(--tx2)]"
              >
                Fechar
              </button>
            </div>

            <div className="mb-1 text-3xl">{selected.icon}</div>
            <h2 className="font-[family-name:var(--font-display)] text-[22px] tracking-wider text-[color:var(--or)]">
              {selected.title}
            </h2>
            <p className="mb-4 text-[12px] leading-relaxed text-[color:var(--tx2)]">
              {selected.description}
            </p>

            {selected.data.porcao && (
              <div className="mb-4 flex flex-wrap gap-1.5">
                <span className="rounded-sm px-2 py-0.5 font-[family-name:var(--font-condensed)] text-[10px] font-semibold" style={{ background: "var(--ord)", color: "var(--or)" }}>
                  {selected.data.porcao.l}
                </span>
                <span className="rounded-sm px-2 py-0.5 font-[family-name:var(--font-condensed)] text-[10px] font-semibold" style={{ background: "var(--pkd)", color: "var(--pk)" }}>
                  {selected.data.porcao.j}
                </span>
              </div>
            )}

            {selected.data.ings && selected.data.ings.length > 0 && (
              <div className="mb-4">
                <div className="slbl mb-2">Ingredientes</div>
                {selected.data.ings.map((ing, i) => (
                  <div key={i} className="flex items-center justify-between border-b border-white/5 py-1 text-[12px]">
                    <span className="text-[color:var(--tx2)]">{ing.n}</span>
                    <span className="rounded-sm bg-[color:var(--s3)] px-2 py-0.5 font-[family-name:var(--font-condensed)] text-[11px] font-bold">
                      {ing.a}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {selected.data.steps && selected.data.steps.length > 0 && (
              <div className="mb-4">
                <div className="slbl mb-2">Preparo</div>
                {selected.data.steps.map((step, i) => (
                  <div key={i} className="mb-2 flex gap-2 text-[12px]">
                    <span className="flex h-[21px] w-[21px] shrink-0 items-center justify-center rounded-full bg-[color:var(--or)] font-[family-name:var(--font-display)] text-[10px] text-white">
                      {i + 1}
                    </span>
                    <span className="flex-1 leading-relaxed text-[color:var(--tx2)]">{step}</span>
                  </div>
                ))}
              </div>
            )}

            {selected.data.tip && (
              <div className="tip-box">
                <div className="tip-box-t">Dica</div>
                <div className="tip-box-c">{selected.data.tip}</div>
              </div>
            )}
          </div>
        </div>
      )}

    </>
  );
}
