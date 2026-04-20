import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildAuthUrl, signState } from "@/lib/google-fit";
import { SITE_URL } from "@/lib/site";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login?next=/conta", SITE_URL));
  }

  const state = signState(user.id);
  return NextResponse.redirect(buildAuthUrl(state));
}
