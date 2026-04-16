"use client";

import { useEffect } from "react";

export default function OnboardingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Onboarding error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[color:var(--bg)] px-4">
      <div className="max-w-md rounded-xl border border-red-500/40 bg-red-500/10 p-6 text-center">
        <div className="mb-3 text-3xl">⚠️</div>
        <h2 className="mb-2 font-[family-name:var(--font-display)] text-xl tracking-wider">
          Erro no onboarding
        </h2>
        <p className="mb-2 text-sm text-red-300">{error.message}</p>
        {error.digest && (
          <p className="mb-4 font-mono text-[10px] text-red-400/60">Digest: {error.digest}</p>
        )}
        <pre className="mb-4 max-h-32 overflow-auto rounded bg-black/30 p-3 text-left text-[10px] text-red-300">
          {error.stack}
        </pre>
        <div className="flex gap-2 justify-center">
          <button
            onClick={reset}
            className="rounded-md bg-[color:var(--or)] px-4 py-2 font-[family-name:var(--font-condensed)] text-sm font-bold uppercase tracking-wider text-black"
          >
            Tentar novamente
          </button>
          <a
            href="/treino"
            className="rounded-md border border-[color:var(--bd)] px-4 py-2 font-[family-name:var(--font-condensed)] text-sm font-bold uppercase tracking-wider text-[color:var(--tx2)]"
          >
            Ir para treino
          </a>
        </div>
      </div>
    </div>
  );
}
