import { NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { sendPaymentConfirmedEmail } from "@/lib/email";

const mp = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
});

function getSupabaseAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

const TIER_LABEL: Record<string, string> = {
  monthly: "Mensal",
  annual: "Anual",
  couple_monthly: "Casal Mensal",
  couple_annual: "Casal Anual",
};

export async function POST(request: Request) {
  const body = await request.json();

  if (body.type !== "payment") {
    return NextResponse.json({ received: true });
  }

  const paymentId = body.data?.id;
  if (!paymentId) {
    return NextResponse.json({ error: "Sem payment ID" }, { status: 400 });
  }

  try {
    const paymentClient = new Payment(mp);
    const payment = await paymentClient.get({ id: paymentId });

    if (payment.status !== "approved") {
      return NextResponse.json({ received: true, status: payment.status });
    }

    const metadata = payment.metadata as {
      user_id?: string;
      plan_tier?: string;
    } | null;

    if (!metadata?.user_id || !metadata?.plan_tier) {
      return NextResponse.json({ error: "Metadata incompleta" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const now = new Date();
    const isAnnual = metadata.plan_tier.includes("annual");
    const periodEnd = new Date(now);
    if (isAnnual) {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    const { data: subscription } = await supabase
      .from("subscriptions")
      .upsert(
        {
          user_id: metadata.user_id,
          tier: metadata.plan_tier,
          status: "active",
          provider: "mercadopago",
          provider_subscription_id: String(paymentId),
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
          updated_at: now.toISOString(),
        },
        { onConflict: "provider_subscription_id" },
      )
      .select("id, last_payment_email_sent_at")
      .single();

    // Email de confirmacao de pagamento (idempotente: max 1 por 24h)
    try {
      const lastSent = subscription?.last_payment_email_sent_at
        ? new Date(subscription.last_payment_email_sent_at).getTime()
        : 0;
      const oneDayMs = 24 * 60 * 60 * 1000;
      if (Date.now() - lastSent > oneDayMs) {
        const { data: userData } = await supabase.auth.admin.getUserById(
          metadata.user_id,
        );
        const email = userData?.user?.email;
        if (email) {
          await sendPaymentConfirmedEmail(email, {
            plan: TIER_LABEL[metadata.plan_tier] ?? metadata.plan_tier,
            amountBRL: Number(payment.transaction_amount ?? 0),
            nextChargeDate: periodEnd,
          });
          if (subscription?.id) {
            await supabase
              .from("subscriptions")
              .update({ last_payment_email_sent_at: new Date().toISOString() })
              .eq("id", subscription.id);
          }
        }
      }
    } catch (err) {
      console.error("[mp/webhook] payment email trigger failed:", err);
    }

    return NextResponse.json({ received: true, activated: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro no webhook";
    console.error("MP webhook error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: "webhook ativo" });
}
