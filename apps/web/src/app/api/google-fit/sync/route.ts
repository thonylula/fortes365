import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchDailyAggregates, refreshAccessToken } from "@/lib/google-fit";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const { data: integration, error: intErr } = await supabase
    .from("health_integrations")
    .select("access_token, refresh_token, expires_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (intErr || !integration) {
    return NextResponse.json({ error: "not_connected" }, { status: 404 });
  }

  let accessToken = integration.access_token;
  const expiresAt = new Date(integration.expires_at).getTime();

  if (expiresAt < Date.now() + 60_000) {
    try {
      const refreshed = await refreshAccessToken(integration.refresh_token);
      accessToken = refreshed.access_token;
      const newExpiresAt = new Date(Date.now() + refreshed.expires_in * 1000);
      await supabase
        .from("health_integrations")
        .update({
          access_token: accessToken,
          expires_at: newExpiresAt.toISOString(),
        })
        .eq("user_id", user.id);
    } catch {
      return NextResponse.json({ error: "refresh_failed" }, { status: 401 });
    }
  }

  const endMs = Date.now();
  const startMs = endMs - 14 * 24 * 60 * 60 * 1000;

  let metrics;
  try {
    metrics = await fetchDailyAggregates(accessToken, startMs, endMs);
  } catch {
    return NextResponse.json({ error: "fetch_failed" }, { status: 502 });
  }

  const rows = metrics
    .filter(
      (m) => m.steps != null || m.active_kcal != null || m.resting_hr != null,
    )
    .map((m) => ({
      user_id: user.id,
      date: m.date,
      steps: m.steps,
      active_kcal: m.active_kcal,
      resting_hr: m.resting_hr,
      source: "google_fit",
      synced_at: new Date().toISOString(),
    }));

  if (rows.length > 0) {
    const { error: upsertErr } = await supabase
      .from("daily_health_metrics")
      .upsert(rows, { onConflict: "user_id,date" });
    if (upsertErr) {
      return NextResponse.json({ error: "save_failed" }, { status: 500 });
    }
  }

  await supabase
    .from("health_integrations")
    .update({ last_sync_at: new Date().toISOString() })
    .eq("user_id", user.id);

  return NextResponse.json({ synced: rows.length });
}
