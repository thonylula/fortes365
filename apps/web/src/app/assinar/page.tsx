import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSubscriptionInfo } from "@/lib/supabase/guards";
import { CheckoutButton } from "./checkout-button";

export const metadata: Metadata = {
  title: "Planos e preços",
  description:
    "Escolha seu plano FORTE 365: gratuito, mensal R$14,90 ou anual R$99,90. Cancelamento em 1 clique.",
  alternates: { canonical: "/assinar" },
};

export default async function AssinarPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/assinar");

  const sub = await getSubscriptionInfo();
  if (sub.isPremium) redirect("/treino");

  const { status } = await searchParams;

  return (
    <div className="flex min-h-screen flex-col bg-[color:var(--bg)]">
      <header className="flex h-[52px] items-center justify-between border-b border-[color:var(--bd)] bg-[color:var(--s1)] px-4">
        <Link href="/" className="logo">
          FORT<span>E</span>
          <sub>365</sub>
        </Link>
        <Link
          href="/treino"
          className="font-[family-name:var(--font-condensed)] text-[11px] font-bold uppercase tracking-[1.5px] text-[color:var(--or)]"
        >
          ← Treino
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-6 py-12">
        {status === "erro" && (
          <div className="mb-6 rounded-md border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            Houve um erro no pagamento. Tente novamente.
          </div>
        )}
        {status === "pendente" && (
          <div className="mb-6 rounded-md border border-[color:var(--yw)]/40 bg-[color:var(--yw)]/10 px-4 py-3 text-sm text-[color:var(--yw)]">
            Pagamento pendente. Assim que confirmado, os 12 meses serão liberados automaticamente.
          </div>
        )}

        <div className="mb-8 text-center">
          <div className="mb-2 text-4xl">💪</div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-wider sm:text-4xl">
            ASSINE O PREMIUM
          </h1>
          <p className="mt-2 text-sm text-[color:var(--tx2)]">
            Desbloqueie os 12 meses completos. Pague com Pix, cartão ou boleto.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <PlanCard
            name="Mensal"
            price="R$ 14,90"
            period="/mês"
            planKey="monthly"
            features={[
              "12 meses de treino periodizado",
              "Nutrição + receitas + compras",
              "Coach IA em português",
              "Cancela quando quiser",
            ]}
            highlight
          />
          <PlanCard
            name="Anual"
            price="R$ 99,90"
            period="/ano"
            planKey="annual"
            badge="44% OFF"
            features={[
              "Tudo do mensal",
              "~R$ 8,30 por mês",
              "Análise de progresso com IA avançada",
              "Melhor custo-benefício",
            ]}
          />
          <PlanCard
            name="Casal"
            price="R$ 19,90"
            period="/mês"
            planKey="couple_monthly"
            features={[
              "2 perfis vinculados",
              "Tudo do mensal × 2",
              "Ideal para treinar junto",
              "Anual: R$ 149/ano",
            ]}
          />
        </div>

        <div className="mt-8 text-center text-xs text-[color:var(--tx3)]">
          Pagamento seguro via Mercado Pago. Aceitamos Pix, cartão e boleto.
          <br />
          Sem fidelidade. Cancele a qualquer momento.
        </div>
      </main>
    </div>
  );
}

function PlanCard({
  name,
  price,
  period,
  badge,
  features,
  highlight,
  planKey,
}: {
  name: string;
  price: string;
  period: string;
  badge?: string;
  features: string[];
  highlight?: boolean;
  planKey: string;
}) {
  return (
    <div
      className="relative flex flex-col rounded-xl p-5"
      style={{
        border: `1.5px solid ${highlight ? "var(--or)" : "var(--bd)"}`,
        background: highlight ? "var(--ord)" : "var(--s1)",
      }}
    >
      {badge && (
        <span
          className="absolute -top-2.5 right-3 rounded-sm px-2 py-0.5 text-[10px] font-bold uppercase"
          style={{ background: "var(--gn)", color: "#000" }}
        >
          {badge}
        </span>
      )}
      <p className="font-[family-name:var(--font-condensed)] text-[11px] font-bold uppercase tracking-wider text-[color:var(--tx3)]">
        {name}
      </p>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="font-[family-name:var(--font-display)] text-3xl tracking-wider">
          {price}
        </span>
        <span className="text-xs text-[color:var(--tx3)]">{period}</span>
      </div>
      <ul className="mt-3 flex-1 space-y-1.5">
        {features.map((f, i) => (
          <li key={i} className="flex gap-1.5 text-[11px] text-[color:var(--tx2)]">
            <span className="text-[color:var(--gn)]">✓</span>
            {f}
          </li>
        ))}
      </ul>
      <CheckoutButton plan={planKey} highlight={highlight} />
    </div>
  );
}
