import { NextResponse } from "next/server";
import { MercadoPagoConfig, PreApproval } from "mercadopago";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

const mp = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
});

type AutoRecurring = {
  frequency: number;
  frequency_type: "months";
  transaction_amount: number;
  currency_id: "BRL";
};

const PLANS: Record<
  string,
  { title: string; tier: string; auto_recurring: AutoRecurring }
> = {
  monthly: {
    title: "FORTE 365 — Premium Mensal",
    tier: "monthly",
    auto_recurring: {
      frequency: 1,
      frequency_type: "months",
      transaction_amount: 14.9,
      currency_id: "BRL",
    },
  },
  annual: {
    title: "FORTE 365 — Premium Anual",
    tier: "annual",
    auto_recurring: {
      frequency: 12,
      frequency_type: "months",
      transaction_amount: 99.9,
      currency_id: "BRL",
    },
  },
  couple_monthly: {
    title: "FORTE 365 — Casal Mensal",
    tier: "couple_monthly",
    auto_recurring: {
      frequency: 1,
      frequency_type: "months",
      transaction_amount: 19.9,
      currency_id: "BRL",
    },
  },
  couple_annual: {
    title: "FORTE 365 — Casal Anual",
    tier: "couple_annual",
    auto_recurring: {
      frequency: 12,
      frequency_type: "months",
      transaction_amount: 149,
      currency_id: "BRL",
    },
  },
};

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const body = await request.json();
  const plan = PLANS[body.plan as string];

  if (!plan) {
    return NextResponse.json({ error: "Plano inválido" }, { status: 400 });
  }

  const origin = request.headers.get("origin") ?? "https://fortes365.vercel.app";

  try {
    const preapproval = new PreApproval(mp);
    const result = await preapproval.create({
      body: {
        reason: plan.title,
        auto_recurring: plan.auto_recurring,
        back_url: `${origin}/assinar/sucesso`,
        payer_email: user.email,
        external_reference: `${user.id}|${plan.tier}`,
        status: "pending",
      },
    });

    if (!result.id || !result.init_point) {
      return NextResponse.json(
        { error: "Falha ao criar assinatura no Mercado Pago" },
        { status: 502 },
      );
    }

    // Pre-insert row com status pending. Webhook vai ativar quando user autorizar.
    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
    await admin.from("subscriptions").upsert(
      {
        user_id: user.id,
        tier: plan.tier,
        status: "pending",
        provider: "mercadopago",
        provider_subscription_id: result.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "provider_subscription_id" },
    );

    return NextResponse.json({ checkout_url: result.init_point });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao criar preferência";
    console.error("[mp/checkout] preapproval create failed:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
