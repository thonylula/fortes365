import { NextResponse } from "next/server";
import { MercadoPagoConfig, PreApproval } from "mercadopago";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

const mp = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
});

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: sub } = await admin
    .from("subscriptions")
    .select("id, provider_subscription_id, current_period_end, cancel_at_period_end")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!sub?.provider_subscription_id) {
    return NextResponse.json(
      { error: "Nenhuma assinatura ativa encontrada" },
      { status: 404 },
    );
  }

  if (sub.cancel_at_period_end) {
    return NextResponse.json({
      ok: true,
      already: true,
      endsAt: sub.current_period_end,
    });
  }

  try {
    const preapproval = new PreApproval(mp);
    await preapproval.update({
      id: sub.provider_subscription_id,
      body: { status: "cancelled" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro no Mercado Pago";
    console.error("[mp/cancel] preapproval update failed:", message);
    return NextResponse.json(
      { error: "Não consegui cancelar no Mercado Pago. Tente de novo." },
      { status: 502 },
    );
  }

  // Mantém status=active até o ciclo expirar. cancel_at_period_end=true
  // sinaliza que não vai renovar. getSubscriptionInfo() não precisa mudar.
  await admin
    .from("subscriptions")
    .update({
      cancel_at_period_end: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", sub.id);

  return NextResponse.json({
    ok: true,
    endsAt: sub.current_period_end,
  });
}
