"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

const TIER_LABEL: Record<string, string> = {
  monthly: "Premium Mensal",
  annual: "Premium Anual",
  couple_monthly: "Casal Mensal",
  couple_annual: "Casal Anual",
  admin: "DEV",
};

type Sub = {
  tier: string;
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function SubscriptionCard({ sub }: { sub: Sub | null }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Sem assinatura
  if (!sub) {
    return (
      <div className="rounded-lg border border-[color:var(--bd)] bg-[color:var(--s1)] p-5">
        <div className="slbl mb-3">Assinatura</div>
        <div className="rounded-md bg-[color:var(--s2)] px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="font-[family-name:var(--font-condensed)] text-sm font-bold uppercase tracking-wider text-[color:var(--gn)]">
              Grátis
            </span>
            <span className="text-xs text-[color:var(--tx3)]">Nível 1 liberado</span>
          </div>
        </div>
        <Link href="/assinar" className="act-btn is-lg is-primary mt-3">
          Assinar Premium →
        </Link>
      </div>
    );
  }

  const tierLabel = TIER_LABEL[sub.tier] ?? sub.tier;
  const endDate = formatDate(sub.current_period_end);

  function handleCancel() {
    if (
      !confirm(
        `Cancelar a assinatura? Você mantém acesso até ${endDate}, sem novas cobranças.`,
      )
    )
      return;

    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/mp/cancel", { method: "POST" });
        const json = (await res.json()) as { ok?: boolean; error?: string };
        if (!res.ok || !json.ok) {
          setError(json.error ?? "Não foi possível cancelar.");
          return;
        }
        router.refresh();
      } catch {
        setError("Erro de rede. Tenta de novo.");
      }
    });
  }

  return (
    <div className="rounded-lg border border-[color:var(--bd)] bg-[color:var(--s1)] p-5">
      <div className="slbl mb-3">Assinatura</div>
      <div className="rounded-md bg-[color:var(--s2)] px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="font-[family-name:var(--font-condensed)] text-sm font-bold uppercase tracking-wider text-[color:var(--or)]">
            {tierLabel}
          </span>
          <span
            className={`rounded-sm px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
              sub.cancel_at_period_end
                ? "bg-red-500/15 text-red-300"
                : "bg-[color:var(--gn)]/15 text-[color:var(--gn)]"
            }`}
          >
            {sub.cancel_at_period_end ? "Cancelada" : "Ativa"}
          </span>
        </div>
        <p className="mt-2 text-xs text-[color:var(--tx3)]">
          {sub.cancel_at_period_end
            ? `Acesso ativo até ${endDate}. Sem novas cobranças.`
            : `Próxima cobrança em ${endDate}.`}
        </p>
      </div>

      {error && (
        <div className="mt-3 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      {sub.cancel_at_period_end ? (
        <Link href="/assinar" className="act-btn is-lg is-primary mt-3">
          Reativar Premium →
        </Link>
      ) : (
        <button
          type="button"
          onClick={handleCancel}
          disabled={isPending}
          className="act-btn is-lg is-danger mt-3"
        >
          {isPending ? "Cancelando..." : "Cancelar assinatura"}
        </button>
      )}
    </div>
  );
}
