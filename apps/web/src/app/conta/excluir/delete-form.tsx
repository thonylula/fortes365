"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteAccount } from "../actions";

export function DeleteAccountForm() {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setDeleting(true);
    const result = await deleteAccount();
    if (result.ok) {
      router.push("/");
    }
    setDeleting(false);
  };

  if (!confirming) {
    return (
      <div className="flex gap-2">
        <a
          href="/conta"
          className="flex-1 rounded-md border border-[color:var(--bd)] py-2.5 text-center font-[family-name:var(--font-condensed)] text-sm font-bold uppercase tracking-wider text-[color:var(--tx2)]"
        >
          Cancelar
        </a>
        <button
          onClick={() => setConfirming(true)}
          className="flex-1 rounded-md border border-red-500/40 bg-red-500/10 py-2.5 font-[family-name:var(--font-condensed)] text-sm font-bold uppercase tracking-wider text-red-400 transition-colors hover:bg-red-500/20"
        >
          Quero excluir
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-bold text-red-400">Tem certeza? Nao ha como desfazer.</p>
      <div className="flex gap-2">
        <button
          onClick={() => setConfirming(false)}
          className="flex-1 rounded-md border border-[color:var(--bd)] py-2.5 font-[family-name:var(--font-condensed)] text-sm font-bold uppercase tracking-wider text-[color:var(--tx2)]"
        >
          Voltar
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="flex-1 rounded-md bg-red-600 py-2.5 font-[family-name:var(--font-condensed)] text-sm font-bold uppercase tracking-wider text-white transition-colors hover:bg-red-700 disabled:opacity-50"
        >
          {deleting ? "Excluindo..." : "Confirmar exclusao"}
        </button>
      </div>
    </div>
  );
}
