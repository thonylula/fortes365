"use client";

import { useState } from "react";
import { saveReview } from "./actions";

type Props = {
  existing: { rating: number; body: string } | null;
  saved?: boolean;
  errorMessage?: string;
};

export function ReviewForm({ existing, saved, errorMessage }: Props) {
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [hover, setHover] = useState(0);
  const [body, setBody] = useState(existing?.body ?? "");
  const display = hover || rating;

  return (
    <form action={saveReview} className="space-y-4">
      <input type="hidden" name="rating" value={rating} />

      <div className="flex flex-col gap-2">
        <label className="font-[family-name:var(--font-condensed)] text-[10px] font-bold uppercase tracking-[2px] text-[color:var(--tx3)]">
          Sua nota
        </label>
        <div
          className="flex items-center gap-1"
          onMouseLeave={() => setHover(0)}
          role="radiogroup"
          aria-label="Nota de 1 a 5 estrelas"
        >
          {[1, 2, 3, 4, 5].map((n) => {
            const filled = n <= display;
            return (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                onMouseEnter={() => setHover(n)}
                onFocus={() => setHover(n)}
                onBlur={() => setHover(0)}
                role="radio"
                aria-checked={rating === n}
                aria-label={`${n} ${n === 1 ? "estrela" : "estrelas"}`}
                className="text-3xl leading-none transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--or)]"
                style={{
                  color: filled ? "var(--or)" : "var(--tx3)",
                }}
              >
                {filled ? "★" : "☆"}
              </button>
            );
          })}
          {rating > 0 && (
            <span className="ml-3 font-[family-name:var(--font-condensed)] text-[11px] uppercase tracking-[1.5px] text-[color:var(--tx2)]">
              {rating}/5
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="review-body"
          className="font-[family-name:var(--font-condensed)] text-[10px] font-bold uppercase tracking-[2px] text-[color:var(--tx3)]"
        >
          Comentário (opcional)
        </label>
        <textarea
          id="review-body"
          name="body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={500}
          rows={4}
          placeholder="Conte como tem sido a experiência com o programa…"
          className="resize-y rounded-md border border-[color:var(--bd)] bg-[color:var(--s2)] px-3 py-2.5 text-sm text-[color:var(--tx)] placeholder:text-[color:var(--tx3)] focus:border-[color:var(--or)] focus:outline-none"
        />
        <div className="text-right text-[10px] text-[color:var(--tx3)]">
          {body.length}/500
        </div>
      </div>

      {errorMessage && (
        <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {errorMessage}
        </div>
      )}

      {saved && (
        <div className="rounded-md border border-[color:var(--gn)]/40 bg-[color:var(--gn)]/10 px-3 py-2 text-sm text-[color:var(--gn)]">
          Avaliação salva. Obrigado pelo feedback.
        </div>
      )}

      <button
        type="submit"
        disabled={rating === 0}
        className="inline-flex h-11 items-center justify-center rounded-sm bg-[color:var(--or)] px-5 font-[family-name:var(--font-condensed)] text-[12px] font-bold uppercase tracking-[2px] text-black transition-colors hover:bg-[#ff7733] disabled:cursor-not-allowed disabled:opacity-40"
      >
        {existing ? "Atualizar avaliação" : "Enviar avaliação"}
      </button>
    </form>
  );
}
