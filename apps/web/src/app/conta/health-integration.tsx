"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Props = {
  connected: boolean;
  lastSyncAt: string | null;
  justConnected?: boolean;
  errorCode?: string | null;
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "agora";
  if (min < 60) return `${min}min atras`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h atras`;
  const d = Math.floor(h / 24);
  return `${d}d atras`;
}

const ERROR_MESSAGES: Record<string, string> = {
  invalid: "Fluxo OAuth invalido, tente novamente.",
  state: "Assinatura do OAuth nao bateu, tente reconectar.",
  save: "Nao foi possivel salvar a integracao.",
  exchange: "O Google recusou a autorizacao.",
  access_denied: "Voce negou a permissao no Google.",
};

export function HealthIntegration({
  connected,
  lastSyncAt,
  justConnected,
  errorCode,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [syncMsg, setSyncMsg] = useState<string | null>(
    justConnected ? "Google Fit conectado." : null,
  );
  const [syncError, setSyncError] = useState<string | null>(
    errorCode ? ERROR_MESSAGES[errorCode] ?? "Erro desconhecido." : null,
  );

  const handleSync = async () => {
    setSyncMsg(null);
    setSyncError(null);
    try {
      const res = await fetch("/api/google-fit/sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setSyncError(data.error === "refresh_failed" ? "Sessao expirada, reconecte." : "Erro ao sincronizar.");
        return;
      }
      setSyncMsg(`Sincronizado: ${data.synced} dias.`);
      startTransition(() => router.refresh());
    } catch {
      setSyncError("Erro de rede.");
    }
  };

  const handleDisconnect = async () => {
    if (typeof window !== "undefined") {
      if (!window.confirm("Desconectar Google Fit? Os dados ja sincronizados ficam.")) {
        return;
      }
    }
    try {
      const res = await fetch("/api/google-fit/disconnect", { method: "POST" });
      if (!res.ok) {
        setSyncError("Erro ao desconectar.");
        return;
      }
      startTransition(() => router.refresh());
    } catch {
      setSyncError("Erro de rede.");
    }
  };

  return (
    <div className="rounded-lg border border-[color:var(--bd)] bg-[color:var(--s1)] p-5">
      <div className="slbl mb-3">Saude e atividade</div>

      {!connected && (
        <>
          <p className="mb-4 text-xs text-[color:var(--tx3)]">
            Conecte o Google Fit pra trazer passos, calorias ativas e FC em repouso pro seu dashboard. Voce pode desconectar a qualquer momento.
          </p>
          <a
            href="/api/google-fit/connect"
            className="block w-full rounded-md bg-[color:var(--or)] py-2.5 text-center font-[family-name:var(--font-condensed)] text-sm font-bold uppercase tracking-wider text-black transition-colors hover:bg-[#ff7733]"
          >
            Conectar Google Fit
          </a>
        </>
      )}

      {connected && (
        <>
          <div className="mb-4 rounded-md bg-[color:var(--s2)] px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="font-[family-name:var(--font-condensed)] text-sm font-bold uppercase tracking-wider text-[color:var(--gn)]">
                Google Fit conectado
              </span>
              <span className="text-xs text-[color:var(--tx3)]">
                {lastSyncAt ? `Sync: ${timeAgo(lastSyncAt)}` : "Nunca sincronizado"}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSync}
              disabled={isPending}
              className="flex-1 rounded-md bg-[color:var(--or)] py-2 font-[family-name:var(--font-condensed)] text-[11px] font-bold uppercase tracking-wider text-black transition-colors hover:bg-[#ff7733] disabled:opacity-50"
            >
              {isPending ? "Sincronizando..." : "Sincronizar agora"}
            </button>
            <button
              onClick={handleDisconnect}
              disabled={isPending}
              className="rounded-md border border-[color:var(--bd)] bg-[color:var(--s2)] px-4 py-2 font-[family-name:var(--font-condensed)] text-[11px] font-bold uppercase tracking-wider text-[color:var(--tx2)] transition-colors hover:border-red-500/40 hover:text-red-400 disabled:opacity-50"
            >
              Desconectar
            </button>
          </div>
        </>
      )}

      {syncMsg && (
        <p className="mt-3 text-xs text-[color:var(--gn)]">{syncMsg}</p>
      )}
      {syncError && (
        <p className="mt-3 text-xs text-red-400">{syncError}</p>
      )}
    </div>
  );
}
