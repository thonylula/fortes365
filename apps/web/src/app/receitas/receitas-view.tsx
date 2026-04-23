"use client";

import { useEffect, useState } from "react";
import { NavTabs } from "@/components/nav-tabs";

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
};

const REGION_LABEL: Record<string, string> = {
  nordeste: "Nordeste",
  sudeste: "Sudeste",
  sul: "Sul",
  norte: "Norte",
  centro_oeste: "Centro-Oeste",
};

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
}: {
  recipes: Recipe[];
  userRegion: string | null;
  effectiveRegion: string;
  hasRegion: boolean;
  regionSupported: boolean;
}) {
  const [selected, setSelected] = useState<Recipe | null>(null);
  const [video, setVideo] = useState<VideoState>({ status: "loading" });
  const [bannerDismissed, setBannerDismissed] = useState(false);

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
    // limpa o ?slug= da URL pra evitar reabrir em refresh
    if (typeof window !== "undefined" && window.location.search.includes("slug=")) {
      const url = new URL(window.location.href);
      url.searchParams.delete("slug");
      window.history.replaceState({}, "", url.toString());
    }
  }

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
        <h1 className="mb-4 font-[family-name:var(--font-display)] text-xl tracking-wider">
          RECEITAS
        </h1>

        {recipes.length === 0 ? (
          <div className="rounded-xl border border-[color:var(--bd)] bg-[color:var(--s1)] px-6 py-10 text-center">
            <div className="mb-3 text-4xl">🍽</div>
            <h3 className="mb-1 font-[family-name:var(--font-display)] text-lg tracking-wider">
              SEM RECEITAS
            </h3>
            <p className="text-sm text-[color:var(--tx2)]">
              Nenhuma receita cadastrada para esta região ainda.
            </p>
          </div>
        ) : (
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
                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] text-[color:var(--tx3)]">
                  {r.state && (
                    <span className="rounded-sm bg-[color:var(--or)]/15 px-1.5 py-0.5 font-semibold text-[color:var(--or)]">
                      📍 {r.state}
                    </span>
                  )}
                  <span>{r.time_label}</span>
                </div>
              </button>
            ))}
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
            </div>
            <p className="mb-4 text-[12px] leading-relaxed text-[color:var(--tx2)]">
              {selected.description}
            </p>

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
