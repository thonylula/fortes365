"use client";

import { useEffect, useMemo, useState } from "react";
import { NavTabs } from "@/components/nav-tabs";
import type { Macros, UserMetrics } from "@/lib/macros";
import {
  FILTER_LABEL,
  fitScore,
  hasReliableNutrition,
  recipeFitsFilter,
  recipeTags,
  type FilterKey,
  type RecipeNutrition,
} from "@/lib/recipes";

type Recipe = {
  slug: string;
  title: string;
  icon: string | null;
  category: string | null;
  time_label: string | null;
  description: string | null;
  cached_video_id: string | null;
  state: string | null;
  data: {
    ings?: { n: string; a: string }[];
    steps?: string[];
    tip?: string;
  };
  nutrition: RecipeNutrition;
};

const REGION_LABEL: Record<string, string> = {
  nordeste: "Nordeste",
  sudeste: "Sudeste",
  sul: "Sul",
  norte: "Norte",
  centro_oeste: "Centro-Oeste",
};

const FILTERS: FilterKey[] = ["all", "for_you", "hiperproteica", "low_kcal", "pos_treino", "low_carb"];

type VideoState =
  | { status: "loading" }
  | { status: "ready"; videoId: string }
  | { status: "error" };

export function ReceitasView({
  recipes,
  userRegion,
  effectiveRegion,
  hasRegion,
  regionSupported,
  userMetrics,
  dailyTarget,
}: {
  recipes: Recipe[];
  userRegion: string | null;
  effectiveRegion: string;
  hasRegion: boolean;
  regionSupported: boolean;
  userMetrics: UserMetrics | null;
  dailyTarget: Macros | null;
}) {
  const [selected, setSelected] = useState<Recipe | null>(null);
  const [video, setVideo] = useState<VideoState>({ status: "loading" });
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [filter, setFilter] = useState<FilterKey>("all");

  // Pré-calcula tags + score por receita (memoizado por mudança de perfil/lista)
  const annotated = useMemo(() => {
    return recipes.map((r) => {
      const tags = recipeTags(r.nutrition);
      const score = fitScore(r.nutrition, userMetrics, dailyTarget);
      return { recipe: r, tags, score };
    });
  }, [recipes, userMetrics, dailyTarget]);

  const filtered = useMemo(() => {
    const list = annotated.filter((a) => recipeFitsFilter(a.tags, a.score, filter));
    if (filter === "for_you") {
      return [...list].sort((a, b) => b.score - a.score);
    }
    return list;
  }, [annotated, filter]);

  // Deep-link: abrir automaticamente a receita cujo slug casa com ?slug=
  useEffect(() => {
    if (typeof window === "undefined") return;
    const slug = new URLSearchParams(window.location.search).get("slug");
    if (!slug) return;
    const match = recipes.find((r) => r.slug === slug);
    if (match) setSelected(match);
  }, [recipes]);

  // Buscar vídeo YouTube quando uma receita é selecionada
  useEffect(() => {
    if (!selected) return;
    let cancelled = false;
    const cacheKey = `yt4_rec_${selected.slug}`;

    async function loadVideo() {
      if (!selected) return;
      // cache local (mais rápido)
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          if (!cancelled) setVideo({ status: "ready", videoId: cached });
          return;
        }
      } catch {}

      // cache no banco (server já selecionou cached_video_id)
      if (selected.cached_video_id) {
        try {
          localStorage.setItem(cacheKey, selected.cached_video_id);
        } catch {}
        if (!cancelled) setVideo({ status: "ready", videoId: selected.cached_video_id });
        return;
      }

      // fallback: busca via API
      setVideo({ status: "loading" });
      try {
        const url = `/api/youtube-search?q=${encodeURIComponent(selected.title)}&slug=${encodeURIComponent(selected.slug)}&kind=recipe`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`status ${res.status}`);
        const json = (await res.json()) as { videoId?: string };
        if (!json.videoId) throw new Error("no videoId");
        try {
          localStorage.setItem(cacheKey, json.videoId);
        } catch {}
        if (!cancelled) setVideo({ status: "ready", videoId: json.videoId });
      } catch {
        if (!cancelled) setVideo({ status: "error" });
      }
    }

    loadVideo();
    return () => {
      cancelled = true;
    };
  }, [selected]);

  const showRegionBanner = !bannerDismissed && (!hasRegion || !regionSupported);
  const bannerMessage = !hasRegion
    ? "Personalize suas receitas: complete seu perfil para receber receitas da sua região."
    : `Receitas ${REGION_LABEL[userRegion ?? ""] ?? ""} em breve — por enquanto mostramos as do ${REGION_LABEL[effectiveRegion] ?? effectiveRegion}.`;

  function closeModal() {
    setSelected(null);
    if (typeof window !== "undefined" && window.location.search.includes("slug=")) {
      const url = new URL(window.location.href);
      url.searchParams.delete("slug");
      window.history.replaceState({}, "", url.toString());
    }
  }

  const selectedAnnot = selected
    ? annotated.find((a) => a.recipe.slug === selected.slug) ?? null
    : null;

  return (
    <>
      <NavTabs />

      {showRegionBanner && (
        <div className="flex items-start gap-2 border-b border-[color:var(--or)]/40 bg-[color:var(--ord)] px-3 py-2 text-xs text-[color:var(--tx1)]">
          <span className="mt-0.5 text-sm leading-none">🧭</span>
          <p className="flex-1 leading-snug">
            {bannerMessage}
            {!hasRegion && (
              <>
                {" "}
                <a
                  href="/onboarding"
                  className="font-semibold text-[color:var(--or)] underline underline-offset-2"
                >
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

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-5 pb-20">
        <h1 className="mb-3 font-[family-name:var(--font-display)] text-xl tracking-wider">
          RECEITAS
        </h1>

        {/* Filtros baseados no perfil científico */}
        <div className="mb-4 -mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {FILTERS.map((key) => {
            const isActive = filter === key;
            const isDisabled = key === "for_you" && !userMetrics;
            return (
              <button
                key={key}
                type="button"
                disabled={isDisabled}
                onClick={() => setFilter(key)}
                title={isDisabled ? "Preencha seu perfil em /conta pra ver receitas que encaixam no seu objetivo" : undefined}
                className={
                  "shrink-0 rounded-md px-3 py-1.5 font-[family-name:var(--font-condensed)] text-[11px] font-bold uppercase tracking-[1.5px] transition-colors " +
                  (isActive
                    ? "bg-[color:var(--or)] text-black"
                    : "border border-[color:var(--bd)] bg-[color:var(--s2)] text-[color:var(--tx2)] hover:border-[color:var(--or)]/50 hover:text-[color:var(--tx)]") +
                  (isDisabled ? " cursor-not-allowed opacity-40 hover:border-[color:var(--bd)] hover:text-[color:var(--tx2)]" : "")
                }
              >
                {FILTER_LABEL[key]}
              </button>
            );
          })}
        </div>

        {!userMetrics && (
          <p className="mb-3 text-[11px] leading-relaxed text-[color:var(--tx3)]">
            Macros mostrados em cada receita são absolutos. Pra ver quais encaixam no seu objetivo (cutting/manutenção/bulking), {" "}
            <a href="/conta" className="text-[color:var(--or)] underline underline-offset-2">
              preencha seu perfil
            </a>
            .
          </p>
        )}

        {filtered.length === 0 ? (
          <div className="rounded-xl border border-[color:var(--bd)] bg-[color:var(--s1)] px-6 py-10 text-center">
            <div className="mb-3 text-4xl">🍽</div>
            <h3 className="mb-1 font-[family-name:var(--font-display)] text-lg tracking-wider">
              {recipes.length === 0 ? "SEM RECEITAS" : "NENHUMA RECEITA NESSE FILTRO"}
            </h3>
            <p className="text-sm text-[color:var(--tx2)]">
              {recipes.length === 0
                ? "Nenhuma receita cadastrada para esta região ainda."
                : "Tente outro filtro ou abra Tudo pra ver todas as receitas."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {filtered.map(({ recipe: r, score }) => {
              const reliable = hasReliableNutrition(r.nutrition);
              const kcalColor =
                !userMetrics || !reliable
                  ? "var(--tx)"
                  : score >= 70
                    ? "var(--gn)"
                    : score >= 40
                      ? "var(--tx)"
                      : "var(--tx3)";
              return (
                <button
                  key={r.slug}
                  onClick={() => setSelected(r)}
                  className={
                    "relative rounded-xl border bg-[color:var(--s1)] p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-lg " +
                    (score >= 70
                      ? "border-[color:var(--or)]/60 hover:border-[color:var(--or)] hover:shadow-[color:var(--or)]/10"
                      : "border-[color:var(--bd)] hover:border-[color:var(--or)] hover:shadow-[color:var(--or)]/5")
                  }
                >
                  {score >= 70 && (
                    <span className="absolute right-1.5 top-1.5 rounded-sm bg-[color:var(--or)] px-1.5 py-0.5 font-[family-name:var(--font-condensed)] text-[9px] font-bold uppercase tracking-wider text-black">
                      ★ pra você
                    </span>
                  )}
                  <div className="mb-1 text-2xl">{r.icon ?? "🍽"}</div>
                  <div className="text-[13px] font-semibold leading-tight">{r.title}</div>
                  <div className="mt-0.5 text-[10px] uppercase tracking-wider text-[color:var(--tx2)]">
                    {r.category}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] text-[color:var(--tx3)]">
                    {r.state && (
                      <span className="rounded-sm bg-[color:var(--or)]/15 px-1.5 py-0.5 font-semibold text-[color:var(--or)]">
                        📍 {r.state}
                      </span>
                    )}
                    <span>{r.time_label}</span>
                  </div>

                  {r.nutrition.total > 0 && (
                    <div className="mt-2 border-t border-white/5 pt-1.5 font-[family-name:var(--font-mono)] text-[10px] leading-tight text-[color:var(--tx3)]">
                      <div>
                        {!reliable && (
                          <span
                            className="mr-0.5 text-[color:var(--tx3)]/70"
                            title="Estimativa parcial — alguns ingredientes não estão no banco"
                          >
                            ~
                          </span>
                        )}
                        <span className="font-bold" style={{ color: kcalColor }}>
                          {r.nutrition.kcal}
                        </span>
                        <span> kcal</span>
                      </div>
                      <div className="mt-0.5">
                        P {r.nutrition.protein_g}g · C {r.nutrition.carb_g}g · G {r.nutrition.fat_g}g
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </main>

      {/* Modal de receita */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={selected.title}
          onClick={closeModal}
          onKeyDown={(e) => e.key === "Escape" && closeModal()}
        >
          <div
            className="w-full max-w-[660px] max-h-[88vh] overflow-y-auto rounded-t-2xl bg-[color:var(--s1)] p-5 animate-[slideUp_0.22s_ease]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex justify-end">
              <button
                onClick={closeModal}
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
            <div className="mb-3 flex flex-wrap items-center gap-1.5 text-[11px] text-[color:var(--tx3)]">
              {selected.state && (
                <span className="rounded-sm bg-[color:var(--or)]/15 px-2 py-0.5 font-semibold text-[color:var(--or)]">
                  📍 {selected.state}
                </span>
              )}
              {selected.category && <span>{selected.category}</span>}
              {selected.time_label && <span>· {selected.time_label}</span>}
              {selectedAnnot && selectedAnnot.score >= 70 && (
                <span className="rounded-sm bg-[color:var(--or)] px-1.5 py-0.5 font-[family-name:var(--font-condensed)] text-[10px] font-bold uppercase tracking-wider text-black">
                  ★ pra você
                </span>
              )}
            </div>
            <p className="mb-4 text-[12px] leading-relaxed text-[color:var(--tx2)]">
              {selected.description}
            </p>

            {/* Bloco "esta refeição vs sua meta" — sempre aparece quando user tem perfil.
                3 estados: completo (cobertura ≥70%), parcial (1-69%), sem dados (0%). */}
            {userMetrics && dailyTarget && (() => {
              const reliable = hasReliableNutrition(selected.nutrition);
              const hasAnyData = selected.nutrition.matched > 0;
              return (
                <div className="mb-4 rounded-md border border-[color:var(--bd)] bg-[color:var(--s2)] p-4">
                  <div className="slbl mb-3 flex items-center justify-between gap-2">
                    <span>Esta refeição vs. sua meta diária</span>
                    {hasAnyData && !reliable && (
                      <span
                        className="rounded-sm bg-[color:var(--ord)] px-1.5 py-0.5 font-[family-name:var(--font-condensed)] text-[9px] font-bold uppercase tracking-wider text-[color:var(--or)]"
                        title={`Estimativa parcial — ${selected.nutrition.matched} de ${selected.nutrition.total} ingredientes na tabela nutricional`}
                      >
                        ~ Parcial
                      </span>
                    )}
                  </div>
                  {hasAnyData ? (
                    <>
                      <div className="space-y-2">
                        <MiniBar label="Kcal" value={selected.nutrition.kcal} target={dailyTarget.kcal} unit="" color="var(--or)" />
                        <MiniBar label="Proteína" value={selected.nutrition.protein_g} target={dailyTarget.protein_g} unit="g" color="var(--or)" />
                        <MiniBar label="Carbo" value={selected.nutrition.carb_g} target={dailyTarget.carb_g} unit="g" color="var(--gn)" />
                        <MiniBar label="Gordura" value={selected.nutrition.fat_g} target={dailyTarget.fat_g} unit="g" color="#facc15" />
                      </div>
                      {!reliable && (
                        <p className="mt-3 text-[10px] leading-relaxed text-[color:var(--tx3)]">
                          Calculado com {selected.nutrition.matched} de {selected.nutrition.total} ingredientes. Os outros não estão no banco — os números aqui podem estar abaixo do real.
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-[12px] leading-relaxed text-[color:var(--tx2)]">
                      Os ingredientes desta receita ainda não estão no banco nutricional.
                      Os macros aparecem aqui assim que pelo menos um ingrediente for reconhecido (TACO, USDA, Open Food Facts).
                    </p>
                  )}
                </div>
              );
            })()}

            {/* Bloco de vídeo YouTube */}
            <div className="mb-4">
              <div className="slbl mb-2">Vídeo do preparo</div>
              {video.status === "loading" && (
                <div className="flex aspect-video w-full items-center justify-center rounded-lg bg-[color:var(--s2)] text-[11px] text-[color:var(--tx3)]">
                  Buscando vídeo…
                </div>
              )}
              {video.status === "ready" && (
                <div className="overflow-hidden rounded-lg bg-black">
                  <iframe
                    key={selected.slug}
                    title={`Vídeo: ${selected.title}`}
                    src={`https://www.youtube-nocookie.com/embed/${video.videoId}?rel=0&modestbranding=1`}
                    className="aspect-video w-full"
                    loading="lazy"
                    allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}
              {video.status === "error" && (
                <a
                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(selected.title + " receita")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex aspect-video w-full items-center justify-center rounded-lg border border-dashed border-[color:var(--bd)] bg-[color:var(--s2)] text-[12px] text-[color:var(--or)]"
                >
                  Buscar no YouTube ↗
                </a>
              )}
            </div>

            {selected.data.ings && selected.data.ings.length > 0 && (
              <div className="mb-4">
                <div className="slbl mb-2">Ingredientes</div>
                {selected.data.ings.map((ing, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between border-b border-white/5 py-1 text-[12px]"
                  >
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

function MiniBar({
  label,
  value,
  target,
  unit,
  color,
}: {
  label: string;
  value: number;
  target: number;
  unit: string;
  color: string;
}) {
  const pct = target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 0;
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between font-[family-name:var(--font-mono)] text-[11px]">
        <span className="text-[color:var(--tx2)]">{label}</span>
        <span className="text-[color:var(--tx3)]">
          <span className="font-bold text-[color:var(--tx)]">{value}</span>
          {unit} / {target}
          {unit} <span className="ml-1 text-[10px]">({pct}%)</span>
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[color:var(--s3)]">
        <div style={{ width: `${pct}%`, background: color }} className="h-full" />
      </div>
    </div>
  );
}
