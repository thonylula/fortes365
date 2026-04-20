import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  exchangeCodeForTokens,
  verifyState,
  GOOGLE_FIT_SCOPES,
} from "@/lib/google-fit";
import { SITE_URL } from "@/lib/site";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      new URL(`/conta?healthError=${encodeURIComponent(error)}`, SITE_URL),
    );
  }
  if (!code || !state) {
    return NextResponse.redirect(new URL("/conta?healthError=invalid", SITE_URL));
  }

  const stateUserId = verifyState(state);
  if (!stateUserId) {
    return NextResponse.redirect(new URL("/conta?healthError=state", SITE_URL));
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.id !== stateUserId) {
    return NextResponse.redirect(
      new URL("/login?next=/conta", SITE_URL),
    );
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    const { error: upsertError } = await supabase
      .from("health_integrations")
      .upsert({
        user_id: user.id,
        provider: "google_fit",
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: expiresAt.toISOString(),
        scopes: GOOGLE_FIT_SCOPES,
        connected_at: new Date().toISOString(),
      });

    if (upsertError) {
      return NextResponse.redirect(
        new URL("/conta?healthError=save", SITE_URL),
      );
    }

    return NextResponse.redirect(new URL("/conta?healthConnected=1", SITE_URL));
  } catch {
    return NextResponse.redirect(new URL("/conta?healthError=exchange", SITE_URL));
  }
}
