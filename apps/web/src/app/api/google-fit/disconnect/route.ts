import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { revokeToken } from "@/lib/google-fit";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const { data: integration } = await supabase
    .from("health_integrations")
    .select("refresh_token")
    .eq("user_id", user.id)
    .maybeSingle();

  if (integration?.refresh_token) {
    try {
      await revokeToken(integration.refresh_token);
    } catch {
      // Se revoke falhar, prossegue mesmo assim com o delete local
    }
  }

  const { error } = await supabase
    .from("health_integrations")
    .delete()
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: "delete_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
