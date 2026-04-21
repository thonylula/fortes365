"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { regeneratePlan } from "./actions";

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
  unauthenticated: "Voce precisa estar logado.",
  profile_not_found: "Perfil nao encontrado. Complete o onboarding primeiro.",
  fetch_failed: "Erro ao buscar dados. Tente de novo.",
  delete_old_failed: "Nao foi possivel limpar plano anterior.",
  insert_failed: "Nao foi possivel salvar o plano.",
};

export function PlanRegenerator({
  generatedAt,
}: {
  generatedAt: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const handleGenerate = () => {
    setMsg(null);
    setErr(null);
    startTransition(async () => {
      const result = await regeneratePlan();
      if (!result.ok) {
        setErr(ERROR_MESSAGES[result.error ?? ""] ?? "Erro desconhecido.");
        return;
      }
      setMsg(
        `Plano gerado com ${result.daysGenerated ?? 0} dias personalizados.`,
      );
      router.refresh();
    });
  };

  const hasExisting = !!generatedAt;

  return (
    <div className="rounded-lg border border-[color:var(--bd)] bg-[color:var(--s1)] p-5">
      <div className="slbl mb-3">Meu plano</div>

      {!hasExisting && (
        <p className="mb-4 text-xs text-[color:var(--tx3)]">
          Gere um plano personalizado com base nas suas respostas do onboarding
          (equipamento, skill alvo, limitacoes, frequencia). Substitui o plano
          padrao pelos seus exercicios.
        </p>
      )}

      {hasExisting && (
        <div className="mb-4 rounded-md bg-[color:var(--s2)] px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="font-[family-name:var(--font-condensed)] text-sm font-bold uppercase tracking-wider text-[color:var(--gn)]">
              Plano personalizado ativo
            </span>
            <span className="text-xs text-[color:var(--tx3)]">
              Gerado {timeAgo(generatedAt)}
            </span>
          </div>
        </div>
      )}

      <button
        onClick={handleGenerate}
        disabled={isPending}
        className="block w-full rounded-md bg-[color:var(--or)] py-2.5 text-center font-[family-name:var(--font-condensed)] text-sm font-bold uppercase tracking-wider text-black transition-colors hover:bg-[#ff7733] disabled:opacity-50"
      >
        {isPending
          ? "Gerando..."
          : hasExisting
            ? "Recriar plano"
            : "Gerar meu plano"}
      </button>

      {msg && <p className="mt-3 text-xs text-[color:var(--gn)]">{msg}</p>}
      {err && <p className="mt-3 text-xs text-red-400">{err}</p>}

      <p className="mt-3 text-[10px] text-[color:var(--tx3)]">
        Pode gerar quantas vezes quiser — sempre reflete o onboarding atual. Seu
        histórico de treinos fica preservado.
      </p>
    </div>
  );
}
