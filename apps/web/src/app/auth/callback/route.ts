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
            .select("display_name")
            .eq("id", user.id)
            .single();

          // Tracking eh best-effort: se a coluna nao existir (migration 0010
          // nao aplicada), tratamos como "email ainda nao enviado" em vez de
          // falhar silenciosamente.
          let alreadySent = false;
          let trackingAvailable = true;
          const { data: tracking, error: trackingError } = await supabase
            .from("profiles")
            .select("welcome_email_sent_at")
            .eq("id", user.id)
            .single();
          if (trackingError) {
            trackingAvailable = false;
            console.warn(
              "[auth/callback] coluna welcome_email_sent_at ausente — rode migration 0010_email_tracking.sql",
            );
          } else if (tracking?.welcome_email_sent_at) {
            alreadySent = true;
          }

          if (!alreadySent) {
            console.log(`[auth/callback] enviando welcome email para ${user.email}`);
            await sendWelcomeEmail(user.email, {
              name: profile?.display_name ?? undefined,
            });
            if (trackingAvailable) {
              await supabase
                .from("profiles")
                .update({ welcome_email_sent_at: new Date().toISOString() })
                .eq("id", user.id);
            }
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
