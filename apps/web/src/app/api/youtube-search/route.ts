import { NextRequest, NextResponse } from "next/server";

const cache = new Map<string, { videoId: string; ts: number }>();
const TTL = 7 * 24 * 60 * 60 * 1000;

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  if (!q) return NextResponse.json({ error: "Missing q" }, { status: 400 });

  const cacheKey = `v3_${q}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < TTL) {
    return NextResponse.json({ videoId: cached.videoId });
  }

  try {
    const query = `${q} exercicio como fazer corretamente`;
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&sp=EgIQAQ%253D%253D`;
    const res = await fetch(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "pt-BR,pt;q=0.9",
      },
    });

    const html = await res.text();

    const videoIds: string[] = [];
    const regex = /"videoId":"([a-zA-Z0-9_-]{11})"/g;
    let m;
    while ((m = regex.exec(html)) !== null) {
      if (!videoIds.includes(m[1])) videoIds.push(m[1]);
    }

    const adIds = new Set<string>();
    const adRegex = /"adVideoId":"([a-zA-Z0-9_-]{11})"/g;
    while ((m = adRegex.exec(html)) !== null) adIds.add(m[1]);

    const filtered = videoIds.filter((id) => !adIds.has(id));
    const videoId = filtered[0] ?? videoIds[0];

    if (!videoId) {
      return NextResponse.json({ error: "No video found" }, { status: 404 });
    }

    cache.set(cacheKey, { videoId, ts: Date.now() });

    return NextResponse.json({ videoId }, {
      headers: { "Cache-Control": "public, max-age=604800" },
    });
  } catch {
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
