import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  const slug = req.nextUrl.searchParams.get("slug");
  if (!q) return NextResponse.json({ error: "Missing q" }, { status: 400 });

  if (slug) {
    const { data } = await supabaseAdmin
      .from("exercises")
      .select("cached_video_id")
      .eq("slug", slug)
      .single();

    if (data?.cached_video_id) {
      return NextResponse.json({ videoId: data.cached_video_id }, {
        headers: { "Cache-Control": "public, max-age=604800" },
      });
    }
  }

  if (!YOUTUBE_API_KEY) {
    return NextResponse.json({ error: "No API key configured" }, { status: 503 });
  }

  try {
    const searchQuery = `${q} como fazer exercicio`;
    const url = new URL("https://www.googleapis.com/youtube/v3/search");
    url.searchParams.set("part", "snippet");
    url.searchParams.set("q", searchQuery);
    url.searchParams.set("type", "video");
    url.searchParams.set("maxResults", "1");
    url.searchParams.set("videoDuration", "short");
    url.searchParams.set("relevanceLanguage", "pt");
    url.searchParams.set("regionCode", "BR");
    url.searchParams.set("key", YOUTUBE_API_KEY);

    const res = await fetch(url.toString());
    const data = await res.json();

    if (!res.ok || !data.items?.length) {
      return NextResponse.json({ error: "No video found" }, { status: 404 });
    }

    const videoId = data.items[0].id.videoId as string;

    if (slug) {
      await supabaseAdmin
        .from("exercises")
        .update({ cached_video_id: videoId })
        .eq("slug", slug);
    }

    return NextResponse.json({ videoId }, {
      headers: { "Cache-Control": "public, max-age=604800" },
    });
  } catch {
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
