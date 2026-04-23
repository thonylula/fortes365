import { NextResponse } from "next/server";
import { MercadoPagoConfig, Payment, PreApproval } from "mercadopago";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
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

const PLAN_AMOUNT: Record<string, number> = {
  monthly: 14.9,
  annual: 99.9,
  couple_monthly: 19.9,
  couple_annual: 149,
};

type WebhookBody = {
  type?: string;
  action?: string;
  data?: { id?: string | number };
};

// ──────────────────────────────────────────────────────────────────────────
// Legacy one-shot payment (Preference) — mantido para compatibilidade
// ──────────────────────────────────────────────────────────────────────────
async function handleLegacyPayment(paymentId: string | number) {
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
  if (isAnnual) periodEnd.setFullYear(periodEnd.getFullYear() + 1);
  else periodEnd.setMonth(periodEnd.getMonth() + 1);

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

  await sendPaymentEmailIdempotent(supabase, subscription, {
    userId: metadata.user_id,
    tier: metadata.plan_tier,
    amount: Number(payment.transaction_amount ?? 0),
    nextChargeDate: periodEnd,
  });

  return NextResponse.json({ received: true, activated: true, flow: "legacy" });
}

// ──────────────────────────────────────────────────────────────────────────
// PreApproval lifecycle: authorized / cancelled / paused
// ──────────────────────────────────────────────────────────────────────────
async function handlePreapproval(preapprovalId: string | number) {
  const client = new PreApproval(mp);
  const pa = await client.get({ id: String(preapprovalId) });

  const externalRef = (pa.external_reference as string | undefined) ?? "";
  const [userId, tierFromRef] = externalRef.split("|");
  if (!userId) {
    return NextResponse.json(
      { error: "external_reference sem user_id" },
      { status: 400 },
    );
  }

  const supabase = getSupabaseAdmin();
  const now = new Date();

  // Map MP status pros nossos enums
  const mpStatus = pa.status as string | undefined;
  let dbStatus: "active" | "canceled" | "past_due" | "pending" = "pending";
  let cancelAtPeriodEnd = false;

  if (mpStatus === "authorized") dbStatus = "active";
  else if (mpStatus === "cancelled") {
    dbStatus = "active"; // mantem acesso ate fim do ciclo
    cancelAtPeriodEnd = true;
  } else if (mpStatus === "paused") dbStatus = "past_due";
  else if (mpStatus === "pending") dbStatus = "pending";

  const nextPayment = pa.next_payment_date
    ? new Date(pa.next_payment_date as string)
    : null;

  const update: Record<string, unknown> = {
    user_id: userId,
    tier: tierFromRef,
    status: dbStatus,
    provider: "mercadopago",
    provider_subscription_id: String(pa.id),
    cancel_at_period_end: cancelAtPeriodEnd,
    updated_at: now.toISOString(),
  };
  if (dbStatus === "active" && !cancelAtPeriodEnd) {
    update.current_period_start = now.toISOString();
    if (nextPayment) update.current_period_end = nextPayment.toISOString();
  }

  await supabase
    .from("subscriptions")
    .upsert(update, { onConflict: "provider_subscription_id" });

  return NextResponse.json({
    received: true,
    flow: "preapproval",
    mp_status: mpStatus,
  });
}

// ──────────────────────────────────────────────────────────────────────────
// Cobrança recorrente aprovada — estende current_period_end
// ──────────────────────────────────────────────────────────────────────────
async function handleRecurringPayment(paymentId: string | number) {
  const paymentClient = new Payment(mp);
  const payment = await paymentClient.get({ id: paymentId });
  if (payment.status !== "approved") {
    return NextResponse.json({ received: true, status: payment.status });
  }

  // preapproval_id vem no payment para subscription_authorized_payment
  const preapprovalId =
    (payment as unknown as { preapproval_id?: string }).preapproval_id ?? null;
  if (!preapprovalId) {
    return NextResponse.json({
      received: true,
      note: "payment sem preapproval_id — pode ser legacy",
    });
  }

  const client = new PreApproval(mp);
  const pa = await client.get({ id: preapprovalId });
  const nextPayment = pa.next_payment_date
    ? new Date(pa.next_payment_date as string)
    : null;

  const supabase = getSupabaseAdmin();
  const now = new Date();

  const { data: subscription } = await supabase
    .from("subscriptions")
    .update({
      status: "active",
      current_period_start: now.toISOString(),
      ...(nextPayment && { current_period_end: nextPayment.toISOString() }),
      updated_at: now.toISOString(),
    })
    .eq("provider_subscription_id", preapprovalId)
    .select("id, user_id, tier, last_payment_email_sent_at")
    .single();

  if (subscription) {
    await sendPaymentEmailIdempotent(supabase, subscription, {
      userId: subscription.user_id,
      tier: subscription.tier,
      amount: Number(payment.transaction_amount ?? 0),
      nextChargeDate: nextPayment ?? new Date(),
    });
  }

  return NextResponse.json({ received: true, flow: "recurring_payment" });
}

// ──────────────────────────────────────────────────────────────────────────
// Email idempotente de pagamento confirmado (reuse do pattern atual)
// ──────────────────────────────────────────────────────────────────────────
async function sendPaymentEmailIdempotent(
  supabase: SupabaseClient,
  subscription: { id?: string; last_payment_email_sent_at?: string | null } | null,
  p: { userId: string; tier: string; amount: number; nextChargeDate: Date },
) {
  if (!subscription?.id) return;
  try {
    const lastSent = subscription.last_payment_email_sent_at
      ? new Date(subscription.last_payment_email_sent_at).getTime()
      : 0;
    const oneDayMs = 24 * 60 * 60 * 1000;
    if (Date.now() - lastSent <= oneDayMs) return;

    const { data: userData } = await supabase.auth.admin.getUserById(p.userId);
    const email = userData?.user?.email;
    if (!email) return;

    await sendPaymentConfirmedEmail(email, {
      plan: TIER_LABEL[p.tier] ?? p.tier,
      amountBRL: p.amount || PLAN_AMOUNT[p.tier] || 0,
      nextChargeDate: p.nextChargeDate,
    });
    await supabase
      .from("subscriptions")
      .update({ last_payment_email_sent_at: new Date().toISOString() })
      .eq("id", subscription.id);
  } catch (err) {
    console.error("[mp/webhook] payment email trigger failed:", err);
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Router principal — discrimina os tipos de evento do MP
// ──────────────────────────────────────────────────────────────────────────
export async function POST(request: Request) {
  let body: WebhookBody = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ received: true, empty: true });
  }

  const eventType = body.type ?? body.action ?? "";
  const resourceId = body.data?.id;

  if (!resourceId) {
    return NextResponse.json({ received: true, no_id: true });
  }

  try {
    if (eventType === "preapproval" || eventType === "subscription_preapproval") {
      return await handlePreapproval(resourceId);
    }
    if (
      eventType === "subscription_authorized_payment" ||
      eventType === "authorized_payment"
    ) {
      return await handleRecurringPayment(resourceId);
    }
    if (eventType === "payment") {
      return await handleLegacyPayment(resourceId);
    }
    return NextResponse.json({ received: true, ignored: eventType });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro no webhook";
    console.error("MP webhook error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: "webhook ativo" });
}
