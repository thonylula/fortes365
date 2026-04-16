import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSubscriptionInfo } from "@/lib/supabase/guards";

export default async function AssinarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/assinar");

  const sub = await getSubscriptionInfo();
  if (sub.isPremium) redirect("/treino");

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
        <div className="mb-8 text-center">
          <div className="mb-2 text-4xl">💪</div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-wider sm:text-4xl">
            ASSINE O PREMIUM
          </h1>
          <p className="mt-2 text-sm text-[color:var(--tx2)]">
            Desbloqueie os 12 meses completos de treino, nutrição e coach IA.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <PlanCard
            name="Mensal"
            price="R$ 14,90"
            period="/mês"
            features={[
              "12 meses de treino periodizado",
              "Nutrição + receitas + lista de compras",
              "Coach IA em português",
              "Cancela quando quiser",
            ]}
            highlight
          />
          <PlanCard
            name="Anual"
            price="R$ 99,90"
            period="/ano"
            badge="44% OFF"
            features={[
              "Tudo do mensal",
              "~R$ 8,30 por mês",
              "Análise mensal de progresso com IA avançada",
              "Melhor custo-benefício",
            ]}
          />
          <PlanCard
            name="Casal"
            price="R$ 19,90"
            period="/mês"
            features={[
              "2 perfis vinculados",
              "Tudo do mensal × 2",
              "Ideal para treinar junto",
              "Anual: R$ 149/ano",
            ]}
          />
        </div>

        <div className="mt-8 rounded-xl border border-[color:var(--or)] bg-[color:var(--ord)] p-5 text-center">
          <p className="font-[family-name:var(--font-condensed)] text-sm font-bold uppercase tracking-wider text-[color:var(--or)]">
            Pagamento via Pix — em breve
          </p>
          <p className="mt-2 text-xs text-[color:var(--tx2)]">
            Estamos finalizando a integração com Mercado Pago.
            Enquanto isso, aproveite os meses 1 e 2 completos de graça.
          </p>
          <Link
            href="/treino"
            className="mt-4 inline-block rounded-md bg-[color:var(--or)] px-6 py-2.5 font-[family-name:var(--font-condensed)] text-sm font-bold uppercase tracking-wider text-black transition-colors hover:bg-[#ff7733]"
          >
            Voltar ao treino grátis
          </Link>
        </div>

        <div className="mt-6 text-center text-xs text-[color:var(--tx3)]">
          Aceitamos Pix, boleto e cartão de crédito via Mercado Pago.
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
}: {
  name: string;
  price: string;
  period: string;
  badge?: string;
  features: string[];
  highlight?: boolean;
}) {
  return (
    <div
      className="relative rounded-xl p-5"
      style={{
        border: `1.5px solid ${highlight ? "var(--or)" : "var(--bd)"}`,
        background: highlight ? "var(--ord)" : "var(--s1)",
      }}
    >
      {badge && (
        <span className="absolute -top-2.5 right-3 rounded-sm px-2 py-0.5 text-[10px] font-bold uppercase" style={{ background: "var(--gn)", color: "#000" }}>
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
      <ul className="mt-3 space-y-1.5">
        {features.map((f, i) => (
          <li key={i} className="flex gap-1.5 text-[11px] text-[color:var(--tx2)]">
            <span className="text-[color:var(--gn)]">✓</span>
            {f}
          </li>
        ))}
      </ul>
    </div>
  );
}
