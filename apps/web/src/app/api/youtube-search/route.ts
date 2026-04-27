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
 * tutorial direto do exercicio.
 */
const TITLE_BLACKLIST: RegExp[] = [
  /\brotina completa\b/i,
  /\btreino completo\b/i,
  /\b\d+\s*dias\b/i,
  /\b\d+\s*min(?:utos)?\s+de\b/i,
  /\bsequ[eê]ncia\s+de\s+exerc[íi]cios\b/i,
  /\bworkout\s+\d+\s*min(?:utes)?\b/i,
  /\bfull\s+body\s+workout\b/i,
  /\bworkout\s+routine\b/i,
  /\bbra[çc]os?\s+firmes/i, // caso reportado: "Braços firmes e resistentes" generico
  /\bperna\s+forte/i,
];

/**
 * Duracao maxima aceita por contexto. Tutoriais sao naturalmente curtos —
 * cortar por duracao e o filtro mais robusto contra videos genericos
 * (compilacoes, treinos completos, "10 minutos de braço") que dominam o
 * ranking do YouTube por watch time.
 *
 * Aquecimento:    180s (3min) — circulos, rotacoes, mobilidade
 * Alongamento:    240s (4min)
 * Exercicio:      360s (6min) — calistenia, demonstracao tecnica
 * Receita:        900s (15min) — preparo de prato
 */
const MAX_DURATION_SEC: Record<string, number> = {
  warmup: 180,
  stretch: 240,
  exercise: 360,
  recipe: 900,
};

/**
 * Parse ISO 8601 duration ("PT1M30S" → 90 segundos).
 * Aceita H, M, S em qualquer combinacao. Tolerante a formatos invalidos.
 */
function parseISO8601Duration(d: string): number {
  const m = d.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!m) return Number.MAX_SAFE_INTEGER;
  const h = parseInt(m[1] ?? "0", 10);
  const min = parseInt(m[2] ?? "0", 10);
  const s = parseInt(m[3] ?? "0", 10);
  return h * 3600 + min * 60 + s;
}

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
  url.searchParams.set("maxResults", "8");
  url.searchParams.set("videoEmbeddable", "true");
  url.searchParams.set("relevanceLanguage", "pt");
  url.searchParams.set("regionCode", "BR");
  url.searchParams.set("safeSearch", "none");
  url.searchParams.set("videoDuration", "short"); // hint pro algoritmo: <4min preferido
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
 * Busca duracoes (em segundos) pra uma lista de videoIds via videos.list.
 * Custa 1 unidade de quota (vs 100 do search) — barato.
 */
async function getDurations(videoIds: string[]): Promise<Record<string, number>> {
  if (!YOUTUBE_API_KEY || videoIds.length === 0) return {};
  const url = new URL("https://www.googleapis.com/youtube/v3/videos");
  url.searchParams.set("part", "contentDetails");
  url.searchParams.set("id", videoIds.join(","));
  url.searchParams.set("key", YOUTUBE_API_KEY);
  try {
    const res = await fetch(url.toString());
    if (!res.ok) return {};
    const data = (await res.json()) as {
      items?: Array<{ id?: string; contentDetails?: { duration?: string } }>;
    };
    const result: Record<string, number> = {};
    for (const item of data.items ?? []) {
      if (item.id && item.contentDetails?.duration) {
        result[item.id] = parseISO8601Duration(item.contentDetails.duration);
      }
    }
    return result;
  } catch {
    return {};
  }
}

/**
 * Escolhe o melhor candidato:
 * 1. Duracao <= max do contexto (warmup=3min, exercise=6min, etc)
 * 2. Titulo nao casa com TITLE_BLACKLIST
 * 3. Pula skipVideoId (caso "buscar outro" do user)
 *
 * Se ninguem passa em (1)+(2), relaxa: pega o mais curto remanescente.
 * Se ainda nada, fallback pro primeiro original (melhor que erro 404).
 */
async function pickBestVideoId(
  items: YouTubeSearchItem[],
  contextKey: string,
  skipVideoId?: string | null,
): Promise<string | null> {
  if (items.length === 0) return null;
  const maxDuration = MAX_DURATION_SEC[contextKey] ?? 600;

  const candidates = items
    .filter((it) => it.id?.videoId)
    .filter((it) => !skipVideoId || it.id?.videoId !== skipVideoId);
  if (candidates.length === 0) return null;

  const ids = candidates.map((it) => it.id!.videoId!);
  const durations = await getDurations(ids);

  // Filtro completo: duracao OK + titulo nao na blacklist
  const passing = candidates.filter((it) => {
    const id = it.id!.videoId!;
    const dur = durations[id] ?? Number.MAX_SAFE_INTEGER;
    if (dur > maxDuration) return false;
    const title = it.snippet?.title ?? "";
    if (TITLE_BLACKLIST.some((re) => re.test(title))) return false;
    return true;
  });
  if (passing.length > 0) return passing[0].id!.videoId!;

  // Relaxa: pelo menos passa duracao (ignora blacklist)
  const byDuration = candidates
    .map((it) => ({ id: it.id!.videoId!, dur: durations[it.id!.videoId!] ?? Number.MAX_SAFE_INTEGER }))
    .filter((x) => x.dur <= maxDuration);
  if (byDuration.length > 0) {
    byDuration.sort((a, b) => a.dur - b.dur);
    return byDuration[0].id;
  }

  // Ultimo recurso: o mais curto remanescente
  const allSorted = candidates
    .map((it) => ({ id: it.id!.videoId!, dur: durations[it.id!.videoId!] ?? Number.MAX_SAFE_INTEGER }))
    .sort((a, b) => a.dur - b.dur);
  return allSorted[0]?.id ?? null;
}

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

async function buildAttempts(
  q: string,
  slug: string | null,
  kind: "recipe" | "exercise" | "stretch",
): Promise<{ attempts: string[]; contextKey: string }> {
  if (kind === "recipe") {
    return {
      attempts: [
        `${q} receita como fazer`,
        `${q} receita passo a passo`,
        `${q} receita`,
        q,
        stripAccents(q),
      ],
      contextKey: "recipe",
    };
  }
  if (kind === "stretch") {
    return {
      attempts: [
        `${q} alongamento como fazer correto`,
        `${q} alongamento yoga tutorial`,
        `${q} alongamento`,
        q,
        stripAccents(q),
      ],
      contextKey: "stretch",
    };
  }

  // exercise: detecta warmup pelo banco pra ajustar contexto e duracao max
  let contextKey = "exercise";
  if (slug) {
    const hints = await fetchExerciseHints(slug);
    const isWarmup =
      hints?.movement_pattern === "warmup" ||
      (hints?.muscle_group ?? "").toLowerCase().includes("aquecimento");
    if (isWarmup) contextKey = "warmup";
    const attempts: string[] = [];
    if (hints?.youtube_query) {
      attempts.push(hints.youtube_query);
    }
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
    return { attempts, contextKey };
  }

  return {
    attempts: [
      `${q} como fazer exercicio correto`,
      `${q} calistenia tutorial`,
      `${q} exercicio`,
      q,
      stripAccents(q),
    ],
    contextKey: "exercise",
  };
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  const slug = req.nextUrl.searchParams.get("slug");
  const rawKind = req.nextUrl.searchParams.get("kind");
  const nocache = req.nextUrl.searchParams.get("nocache") === "1";
  const skipVideoId = req.nextUrl.searchParams.get("skip");
  const kind: "recipe" | "exercise" | "stretch" =
    rawKind === "recipe" ? "recipe" : rawKind === "stretch" ? "stretch" : "exercise";
  const cacheTable = kind === "recipe" ? "recipes" : kind === "exercise" ? "exercises" : null;
  if (!q) return NextResponse.json({ error: "Missing q" }, { status: 400 });

  // 1) cache hit (pulado quando nocache=1 ou skip=<videoId>)
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

  // 2) Tenta queries em ordem; pra cada, busca + filtra duracao + blacklist
  const { attempts, contextKey } = await buildAttempts(q, slug, kind);

  let videoId: string | null = null;
  for (const query of attempts) {
    const items = await searchYouTube(query);
    videoId = await pickBestVideoId(items, contextKey, skipVideoId);
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
