import { NextRequest, NextResponse } from "next/server";

const cache = new Map<string, { videoId: string; ts: number }>();
const TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  if (!q) return NextResponse.json({ error: "Missing q" }, { status: 400 });

  const cached = cache.get(q);
  if (cached && Date.now() - cached.ts < TTL) {
    return NextResponse.json({ videoId: cached.videoId });
  }

  try {
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent("como fazer " + q + " exercicio tutorial")}`;
    const res = await fetch(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept-Language": "pt-BR,pt;q=0.9",
      },
    });

    const html = await res.text();
    const match = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);

    if (!match) {
      return NextResponse.json({ error: "No video found" }, { status: 404 });
    }

    const videoId = match[1];
    cache.set(q, { videoId, ts: Date.now() });

    return NextResponse.json({ videoId }, {
      headers: { "Cache-Control": "public, max-age=604800" },
    });
  } catch {
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
