"use client";

import { useState, useTransition } from "react";
import { submitFeedback } from "./actions";

const CATEGORY_OPTIONS: { value: string; label: string }[] = [
  { value: "sugestao", label: "Sugestao de melhoria" },
  { value: "bug", label: "Relatar um problema" },
  { value: "elogio", label: "Elogio" },
  { value: "outro", label: "Outro" },
];

export function FeedbackForm() {
  const [category, setCategory] = useState("sugestao");
  const [message, setMessage] = useState("");
  const [saved, setSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    setSaved(false);
    setErrorMessage(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("category", category);
      fd.set("message", message);
      const res = await submitFeedback(fd);
      if (res.ok) {
        setSaved(true);
        setMessage("");
        setTimeout(() => setSaved(false), 4000);
      } else {
        setErrorMessage(res.error ?? "Nao consegui enviar.");
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <label
          htmlFor="feedback-category"
          className="font-[family-name:var(--font-condensed)] text-[10px] font-bold uppercase tracking-[2px] text-[color:var(--tx3)]"
        >
          Tipo
        </label>
        <select
          id="feedback-category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-md border border-[color:var(--bd)] bg-[color:var(--s2)] px-3 py-2.5 text-sm text-[color:var(--tx)] focus:border-[color:var(--or)] focus:outline-none"
        >
          {CATEGORY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="feedback-message"
          className="font-[family-name:var(--font-condensed)] text-[10px] font-bold uppercase tracking-[2px] text-[color:var(--tx3)]"
        >
          Sua mensagem
        </label>
        <textarea
          id="feedback-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={500}
          rows={5}
          placeholder="Conte o que voce gostaria de ver melhorado. Seja especifico — quanto mais contexto, mais facil agir."
          className="resize-y rounded-md border border-[color:var(--bd)] bg-[color:var(--s2)] px-3 py-2.5 text-sm text-[color:var(--tx)] placeholder:text-[color:var(--tx3)] focus:border-[color:var(--or)] focus:outline-none"
        />
        <div className="text-right text-[10px] text-[color:var(--tx3)]">
          {message.length}/500
        </div>
      </div>

      {errorMessage && (
        <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {errorMessage}
        </div>
      )}

      {saved && (
        <div className="rounded-md border border-[color:var(--gn)]/40 bg-[color:var(--gn)]/10 px-3 py-2 text-sm text-[color:var(--gn)]">
          Sugestao enviada. Obrigado pelo feedback!
        </div>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={isPending || message.trim().length < 10}
        className="inline-flex h-11 items-center justify-center rounded-sm bg-[color:var(--or)] px-5 font-[family-name:var(--font-condensed)] text-[12px] font-bold uppercase tracking-[2px] text-black transition-colors hover:bg-[#ff7733] disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isPending ? "Enviando..." : "Enviar sugestao"}
      </button>
    </div>
  );
}
