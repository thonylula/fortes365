import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendWelcomeEmail } from "@/lib/email";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/treino";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("display_name, welcome_email_sent_at")
            .eq("id", user.id)
            .single();
          if (profile && !profile.welcome_email_sent_at) {
            await sendWelcomeEmail(user.email, {
              name: profile.display_name ?? undefined,
            });
            await supabase
              .from("profiles")
              .update({ welcome_email_sent_at: new Date().toISOString() })
              .eq("id", user.id);
          }
        }
      } catch (err) {
        console.error("[auth/callback] welcome email trigger failed:", err);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent("Erro ao confirmar email. Tente novamente.")}`);
}
