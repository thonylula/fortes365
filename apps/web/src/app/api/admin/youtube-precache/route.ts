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
    return data.items?.[0]?.id?.videoId ?? null;
  } catch {
    return null;
  }
}

async function resolveVideoFor(name: string): Promise<string | null> {
  const attempts = [
    `${name} como fazer exercicio`,
    `${name} calistenia tutorial`,
    `${name} exercicio`,
    name,
    stripAccents(name),
  ];
  for (const q of attempts) {
    const vid = await searchYouTube(q);
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
    .select("slug, name")
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

  for (const ex of exercises ?? []) {
    const videoId = await resolveVideoFor(ex.name);
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
