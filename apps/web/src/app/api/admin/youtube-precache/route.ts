import { NextRequest, NextResponse } from "next/server";
import { createClient as createServer } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { ensureAdmin } from "@/lib/admin";

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

function stripAccents(s: string): string {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

// Mesma blacklist da rota /api/youtube-search — manter sincronizado
const TITLE_BLACKLIST: RegExp[] = [
  /\brotina completa\b/i,
  /\btreino completo\b/i,
  /\b\d+\s*dias\b/i,
  /\b\d+\s*min(?:utos)?\s+de\b/i,
  /\bsequ[eê]ncia\s+de\s+exerc[íi]cios\b/i,
  /\bworkout\s+\d+\s*min(?:utes)?\b/i,
  /\bfull\s+body\s+workout\b/i,
  /\bworkout\s+routine\b/i,
];

type YouTubeSearchItem = {
  id?: { videoId?: string };
  snippet?: { title?: string };
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

function pickBestVideoId(items: YouTubeSearchItem[]): string | null {
  if (items.length === 0) return null;
  const filtered = items.filter((it) => {
    const title = it.snippet?.title ?? "";
    return !TITLE_BLACKLIST.some((re) => re.test(title));
  });
  return filtered[0]?.id?.videoId ?? items[0]?.id?.videoId ?? null;
}

type ExerciseRow = {
  slug: string;
  name: string;
  youtube_query: string | null;
  movement_pattern: string | null;
  muscle_group: string | null;
};

/**
 * Constroi a lista de queries em ordem, contextualizada pelo exercicio.
 * Reusa a logica da rota publica /api/youtube-search.
 */
function buildAttempts(ex: ExerciseRow): string[] {
  const attempts: string[] = [];
  if (ex.youtube_query) {
    attempts.push(ex.youtube_query);
  }
  const isWarmup =
    ex.movement_pattern === "warmup" ||
    (ex.muscle_group ?? "").toLowerCase().includes("aquecimento");
  if (isWarmup) {
    attempts.push(`aquecimento ${ex.name} como fazer correto`);
    attempts.push(`${ex.name} aquecimento tutorial`);
  } else {
    attempts.push(`${ex.name} como fazer exercicio correto`);
    attempts.push(`${ex.name} calistenia tutorial`);
    attempts.push(`${ex.name} exercicio`);
  }
  attempts.push(ex.name);
  attempts.push(stripAccents(ex.name));
  return attempts;
}

async function resolveVideoFor(ex: ExerciseRow): Promise<string | null> {
  const attempts = buildAttempts(ex);
  for (const q of attempts) {
    const items = await searchYouTube(q);
    const vid = pickBestVideoId(items);
    if (vid) return vid;
  }
  return null;
}

export async function GET(req: NextRequest) {
  const supabase = await createServer();
  const admin = await ensureAdmin(supabase);
  if (!admin.ok) {
    return NextResponse.json({ error: admin.reason }, { status: 403 });
  }

  if (!YOUTUBE_API_KEY) {
    return NextResponse.json(
      { error: "YOUTUBE_API_KEY missing in env" },
      { status: 503 },
    );
  }

  const limit = Math.min(
    Math.max(Number(req.nextUrl.searchParams.get("limit") ?? 20), 1),
    50,
  );

  // Pega N exercicios sem cache ainda
  const { data: exercises, error: selErr } = await supabaseAdmin
    .from("exercises")
    .select("slug, name, youtube_query, movement_pattern, muscle_group")
    .is("cached_video_id", null)
    .order("slug")
    .limit(limit);

  if (selErr) {
    return NextResponse.json({ error: "select_failed" }, { status: 500 });
  }

  const { count: totalRemaining } = await supabaseAdmin
    .from("exercises")
    .select("slug", { count: "exact", head: true })
    .is("cached_video_id", null);

  const processed: Array<{ slug: string; videoId: string }> = [];
  const failures: string[] = [];

  for (const ex of (exercises ?? []) as ExerciseRow[]) {
    const videoId = await resolveVideoFor(ex);
    if (videoId) {
      await supabaseAdmin
        .from("exercises")
        .update({ cached_video_id: videoId })
        .eq("slug", ex.slug);
      processed.push({ slug: ex.slug, videoId });
    } else {
      failures.push(ex.slug);
    }
  }

  return NextResponse.json({
    admin: admin.email,
    processed: processed.length,
    failures: failures.length,
    remaining_before: totalRemaining ?? 0,
    remaining_after: Math.max(0, (totalRemaining ?? 0) - processed.length),
    succeeded: processed,
    failed_slugs: failures,
  });
}
