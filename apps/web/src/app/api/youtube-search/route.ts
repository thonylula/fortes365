import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

function stripAccents(s: string): string {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

/**
 * Padroes de titulo que sinalizam video generico/longo demais pra ser
 * tutorial direto do exercicio. Rejeitamos esses na hora de escolher.
 *
 * Justificativa: pra "Circulos de Braço" (warmup de 30s), nao queremos
 * "Treino completo de braços em 10 minutos" — esse fica primeiro no
 * YouTube por watch time, mas é genérico errado.
 */
const TITLE_BLACKLIST: RegExp[] = [
  /\brotina completa\b/i,
  /\btreino completo\b/i,
  /\b\d+\s*dias\b/i, // "30 dias", "21 dias"
  /\b\d+\s*min(?:utos)?\s+de\b/i, // "10 minutos de exercicios"
  /\bsequ[eê]ncia\s+de\s+exerc[íi]cios\b/i,
  /\bworkout\s+\d+\s*min(?:utes)?\b/i,
  /\bfull\s+body\s+workout\b/i,
  /\bworkout\s+routine\b/i,
];

type YouTubeSearchItem = {
  id?: { videoId?: string };
  snippet?: { title?: string; channelTitle?: string };
};

async function searchYouTube(query: string): Promise<YouTubeSearchItem[]> {
  if (!YOUTUBE_API_KEY) return [];
  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("q", query);
  url.searchParams.set("type", "video");
  url.searchParams.set("maxResults", "5");
  url.searchParams.set("videoEmbeddable", "true");
  url.searchParams.set("relevanceLanguage", "pt");
  url.searchParams.set("regionCode", "BR");
  url.searchParams.set("safeSearch", "none");
  url.searchParams.set("key", YOUTUBE_API_KEY);

  try {
    const res = await fetch(url.toString());
    if (!res.ok) return [];
    const data = (await res.json()) as { items?: YouTubeSearchItem[] };
    return data.items ?? [];
  } catch {
    return [];
  }
}

/**
 * Filtra items pela blacklist de titulos genericos. Retorna o primeiro
 * videoId que passou no filtro, ou (se nada passar) o primeiro original
 * como fallback minimo — ainda melhor que erro 404.
 */
function pickBestVideoId(items: YouTubeSearchItem[], skipVideoId?: string | null): string | null {
  if (items.length === 0) return null;
  const filtered = items.filter((it) => {
    const title = it.snippet?.title ?? "";
    if (skipVideoId && it.id?.videoId === skipVideoId) return false;
    return !TITLE_BLACKLIST.some((re) => re.test(title));
  });
  return filtered[0]?.id?.videoId ?? items[0]?.id?.videoId ?? null;
}

/**
 * Busca um exercicio pelo slug pra obter youtube_query custom
 * (override por admin) e movement_pattern (pra contextualizar query).
 */
async function fetchExerciseHints(
  slug: string,
): Promise<{ youtube_query: string | null; movement_pattern: string | null; muscle_group: string | null } | null> {
  const { data } = await supabaseAdmin
    .from("exercises")
    .select("youtube_query, movement_pattern, muscle_group")
    .eq("slug", slug)
    .single();
  return data ?? null;
}

/**
 * Constroi a lista de queries a tentar, em ordem de especificidade.
 * - Se exercise tem youtube_query custom, ele entra primeiro.
 * - Senao, contextualiza por movement_pattern (warmup/strength/etc).
 * - Fallbacks progressivos pra garantir que algo seja achado.
 */
async function buildAttempts(
  q: string,
  slug: string | null,
  kind: "recipe" | "exercise" | "stretch",
): Promise<string[]> {
  if (kind === "recipe") {
    return [
      `${q} receita como fazer`,
      `${q} receita passo a passo`,
      `${q} receita`,
      q,
      stripAccents(q),
    ];
  }
  if (kind === "stretch") {
    return [
      `${q} alongamento como fazer correto`,
      `${q} alongamento yoga tutorial`,
      `${q} alongamento`,
      q,
      stripAccents(q),
    ];
  }

  // exercise: tenta override custom primeiro
  if (slug) {
    const hints = await fetchExerciseHints(slug);
    const attempts: string[] = [];
    if (hints?.youtube_query) {
      attempts.push(hints.youtube_query);
    }
    const isWarmup =
      hints?.movement_pattern === "warmup" ||
      (hints?.muscle_group ?? "").toLowerCase().includes("aquecimento");
    if (isWarmup) {
      attempts.push(`aquecimento ${q} como fazer correto`);
      attempts.push(`${q} aquecimento tutorial`);
    } else {
      attempts.push(`${q} como fazer exercicio correto`);
      attempts.push(`${q} calistenia tutorial`);
      attempts.push(`${q} exercicio`);
    }
    attempts.push(q);
    attempts.push(stripAccents(q));
    return attempts;
  }

  // sem slug: comportamento original
  return [
    `${q} como fazer exercicio correto`,
    `${q} calistenia tutorial`,
    `${q} exercicio`,
    q,
    stripAccents(q),
  ];
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  const slug = req.nextUrl.searchParams.get("slug");
  const rawKind = req.nextUrl.searchParams.get("kind");
  const nocache = req.nextUrl.searchParams.get("nocache") === "1";
  const skipVideoId = req.nextUrl.searchParams.get("skip");
  const kind: "recipe" | "exercise" | "stretch" =
    rawKind === "recipe" ? "recipe" : rawKind === "stretch" ? "stretch" : "exercise";
  // stretches nao tem tabela propria (stretches vivem em plan_days.raw). sem cache no DB.
  const cacheTable = kind === "recipe" ? "recipes" : kind === "exercise" ? "exercises" : null;
  if (!q) return NextResponse.json({ error: "Missing q" }, { status: 400 });

  // 1) cache hit (pulado quando nocache=1 ou skip=<videoId> — pro botao "video errado")
  if (slug && cacheTable && !nocache && !skipVideoId) {
    const { data } = await supabaseAdmin
      .from(cacheTable)
      .select("cached_video_id")
      .eq("slug", slug)
      .single();

    if (data?.cached_video_id) {
      return NextResponse.json(
        { videoId: data.cached_video_id, source: "cache" },
        { headers: { "Cache-Control": "public, max-age=604800" } },
      );
    }
  }

  if (!YOUTUBE_API_KEY) {
    return NextResponse.json(
      { error: "No API key configured" },
      { status: 503 },
    );
  }

  // 2) queries progressivamente mais simples ate achar (com filtro de titulo)
  const attempts = await buildAttempts(q, slug, kind);

  let videoId: string | null = null;
  for (const query of attempts) {
    const items = await searchYouTube(query);
    videoId = pickBestVideoId(items, skipVideoId);
    if (videoId) break;
  }

  if (!videoId) {
    return NextResponse.json({ error: "No video found" }, { status: 404 });
  }

  if (slug && cacheTable) {
    await supabaseAdmin
      .from(cacheTable)
      .update({ cached_video_id: videoId })
      .eq("slug", slug);
  }

  return NextResponse.json(
    { videoId, source: nocache || skipVideoId ? "fresh" : "fresh-cached" },
    { headers: { "Cache-Control": "public, max-age=604800" } },
  );
}
