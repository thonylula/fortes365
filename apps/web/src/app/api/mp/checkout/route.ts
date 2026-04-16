import { NextResponse } from "next/server";
import { MercadoPagoConfig, Preference } from "mercadopago";
import { createClient } from "@/lib/supabase/server";

const mp = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
});

const PLANS = {
  monthly: {
    title: "FORTE 365 — Premium Mensal",
    price: 14.9,
    tier: "monthly" as const,
  },
  annual: {
    title: "FORTE 365 — Premium Anual",
    price: 99.9,
    tier: "annual" as const,
  },
  couple_monthly: {
    title: "FORTE 365 — Casal Mensal",
    price: 19.9,
    tier: "couple_monthly" as const,
  },
  couple_annual: {
    title: "FORTE 365 — Casal Anual",
    price: 149,
    tier: "couple_annual" as const,
  },
} as const;

type PlanKey = keyof typeof PLANS;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const body = await request.json();
  const planKey = body.plan as PlanKey;
  const plan = PLANS[planKey];

  if (!plan) {
    return NextResponse.json({ error: "Plano inválido" }, { status: 400 });
  }

  const origin = request.headers.get("origin") ?? "https://fortes365.vercel.app";

  try {
    const preference = new Preference(mp);
    const result = await preference.create({
      body: {
        items: [
          {
            id: planKey,
            title: plan.title,
            quantity: 1,
            unit_price: plan.price,
            currency_id: "BRL",
          },
        ],
        payer: {
          email: user.email!,
        },
        metadata: {
          user_id: user.id,
          plan_tier: plan.tier,
          user_email: user.email,
        },
        back_urls: {
          success: `${origin}/assinar/sucesso`,
          failure: `${origin}/assinar?status=erro`,
          pending: `${origin}/assinar?status=pendente`,
        },
        auto_return: "approved",
        notification_url: `${origin}/api/mp/webhook`,
        statement_descriptor: "FORTE365",
      },
    });

    return NextResponse.json({
      checkout_url: result.init_point,
      sandbox_url: result.sandbox_init_point,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao criar preferência";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
