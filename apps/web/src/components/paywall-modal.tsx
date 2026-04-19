"use client";

import Link from "next/link";

export function PaywallModal({
  isLoggedIn,
  onClose,
}: {
  isLoggedIn: boolean;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Conteudo premium"
      onClick={onClose}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
    >
      <div
        className="w-full max-w-md rounded-xl bg-[color:var(--s1)] p-6 animate-[slideUp_0.22s_ease]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 text-center">
          <div className="mb-2 text-4xl">🔒</div>
          <h2 className="font-[family-name:var(--font-display)] text-2xl tracking-wider">
            CONTEÚDO PREMIUM
          </h2>
          <p className="mt-2 text-sm text-[color:var(--tx2)]">
            Este nível faz parte do programa completo de 12 níveis.
            O Nível 1 é gratis para sempre.
          </p>
        </div>

        <div className="mb-4 space-y-2">
          <div className="rounded-lg border border-[color:var(--or)] bg-[color:var(--ord)] p-3">
            <div className="flex items-baseline justify-between">
              <span className="font-[family-name:var(--font-condensed)] text-[11px] font-bold uppercase tracking-wider text-[color:var(--or)]">
                Mensal
              </span>
              <span className="font-[family-name:var(--font-display)] text-xl tracking-wider">
                R$ 14,90
              </span>
            </div>
            <p className="text-[11px] text-[color:var(--tx2)]">
              12 níveis completos + coach IA + receitas + lista de compras
            </p>
          </div>
          <div className="rounded-lg border border-[color:var(--bd)] bg-[color:var(--s2)] p-3">
            <div className="flex items-baseline justify-between">
              <span className="font-[family-name:var(--font-condensed)] text-[11px] font-bold uppercase tracking-wider text-[color:var(--gn)]">
                Anual · 44% off
              </span>
              <span className="font-[family-name:var(--font-display)] text-xl tracking-wider">
                R$ 99,90
              </span>
            </div>
            <p className="text-[11px] text-[color:var(--tx2)]">
              ~R$ 8,30/mês + análise periódica de progresso com IA avançada
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {isLoggedIn ? (
            <Link
              href="/assinar"
              className="block w-full rounded-md bg-[color:var(--or)] py-3 text-center font-[family-name:var(--font-condensed)] text-sm font-bold uppercase tracking-wider text-black transition-colors hover:bg-[#ff7733]"
            >
              Assinar agora
            </Link>
          ) : (
            <Link
              href="/cadastro"
              className="block w-full rounded-md bg-[color:var(--or)] py-3 text-center font-[family-name:var(--font-condensed)] text-sm font-bold uppercase tracking-wider text-black transition-colors hover:bg-[#ff7733]"
            >
              Criar conta grátis
            </Link>
          )}
          <button
            onClick={onClose}
            className="w-full rounded-md border border-[color:var(--bd)] py-2.5 font-[family-name:var(--font-condensed)] text-[11px] font-bold uppercase tracking-wider text-[color:var(--tx2)] transition-colors hover:border-[color:var(--tx3)]"
          >
            Voltar ao Nível 1
          </button>
        </div>
      </div>

    </div>
  );
}
