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

async function searchYouTube(query: string): Promise<string | null> {
  if (!YOUTUBE_API_KEY) return null;
  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("q", query);
  url.searchParams.set("type", "video");
  url.searchParams.set("maxResults", "3");
  url.searchParams.set("videoEmbeddable", "true");
  url.searchParams.set("relevanceLanguage", "pt");
  url.searchParams.set("regionCode", "BR");
  url.searchParams.set("safeSearch", "none");
  url.searchParams.set("key", YOUTUBE_API_KEY);

  try {
    const res = await fetch(url.toString());
    if (!res.ok) return null;
    const data = (await res.json()) as {
      items?: Array<{ id?: { videoId?: string } }>;
    };
    const videoId = data.items?.[0]?.id?.videoId;
    return videoId ?? null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  const slug = req.nextUrl.searchParams.get("slug");
  const rawKind = req.nextUrl.searchParams.get("kind");
  const kind: "recipe" | "exercise" | "stretch" =
    rawKind === "recipe" ? "recipe" : rawKind === "stretch" ? "stretch" : "exercise";
  // stretches nao tem tabela propria (stretches vivem em plan_days.raw). sem cache no DB.
  const cacheTable = kind === "recipe" ? "recipes" : kind === "exercise" ? "exercises" : null;
  if (!q) return NextResponse.json({ error: "Missing q" }, { status: 400 });

  // 1) cache hit
  if (slug && cacheTable) {
    const { data } = await supabaseAdmin
      .from(cacheTable)
      .select("cached_video_id")
      .eq("slug", slug)
      .single();

    if (data?.cached_video_id) {
      return NextResponse.json(
        { videoId: data.cached_video_id },
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

  // 2) queries progressivamente mais simples ate achar (variam por contexto)
  const attempts =
    kind === "recipe"
      ? [
          `${q} receita como fazer`,
          `${q} receita passo a passo`,
          `${q} receita`,
          q,
          stripAccents(q),
        ]
      : kind === "stretch"
      ? [
          `${q} alongamento como fazer`,
          `${q} alongamento yoga`,
          `${q} alongamento`,
          q,
          stripAccents(q),
        ]
      : [
          `${q} como fazer exercicio`,
          `${q} calistenia tutorial`,
          `${q} exercicio`,
          q,
          stripAccents(q),
        ];

  let videoId: string | null = null;
  for (const query of attempts) {
    videoId = await searchYouTube(query);
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
    { videoId },
    { headers: { "Cache-Control": "public, max-age=604800" } },
  );
}
