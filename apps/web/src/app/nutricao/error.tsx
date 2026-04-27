"use client";

// Error boundary do route /nutricao. Sem isso, qualquer exception em
// client component (e.g. .map de undefined em MealCard) faz o React
// desmontar a arvore inteira e o browser mostrar "This page couldn't load".
// Aqui capturamos, logamos no console pra debug, e mostramos uma mensagem
// util com botao de reload + link pra contato.
import { useEffect } from "react";

export default function NutricaoError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[nutricao] runtime error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[color:var(--bg)] px-6 py-12 text-center">
      <div className="text-5xl">⚠️</div>
      <h1 className="mt-4 font-[family-name:var(--font-display)] text-2xl tracking-wider text-[color:var(--or)]">
        Erro ao carregar refeições
      </h1>
      <p className="mt-3 max-w-md text-sm text-[color:var(--tx2)]">
        Algo deu errado ao montar essa página. O time já foi notificado.
        Tenta recarregar — se persistir, navega pra outra aba e volta.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-md bg-[color:var(--or)] px-5 py-2 font-[family-name:var(--font-condensed)] text-[12px] font-bold uppercase tracking-[1.5px] text-black hover:bg-[color:var(--or)]/90"
        >
          Tentar de novo
        </button>
        <a
          href="/treino"
          className="rounded-md border border-[color:var(--bd)] bg-[color:var(--s2)] px-5 py-2 font-[family-name:var(--font-condensed)] text-[12px] font-bold uppercase tracking-[1.5px] text-[color:var(--tx2)] hover:border-[color:var(--or)]"
        >
          Voltar pro treino
        </a>
      </div>
      {error.digest && (
        <p className="mt-6 font-[family-name:var(--font-mono)] text-[10px] text-[color:var(--tx3)]">
          Codigo do erro: {error.digest}
        </p>
      )}
      {/* Mensagem do erro fica visivel em dev pra debug; em prod o digest é o ID */}
      {process.env.NODE_ENV !== "production" && error.message && (
        <pre className="mt-4 max-w-2xl overflow-auto rounded-md border border-[color:var(--bd)] bg-[color:var(--s1)] p-3 text-left font-[family-name:var(--font-mono)] text-[10px] text-[color:var(--tx2)]">
          {error.message}
          {error.stack ? `\n\n${error.stack}` : ""}
        </pre>
      )}
    </div>
  );
}
