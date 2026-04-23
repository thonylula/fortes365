"use client";

import { useMemo, useState } from "react";

export type FeedbackEntry = {
  id: string;
  user_id: string;
  email: string;
  category: "sugestao" | "bug" | "elogio" | "outro";
  message: string;
  created_at: string;
};

type Counts = {
  total: number;
  sugestao: number;
  bug: number;
  elogio: number;
  outro: number;
};

type Filter = "todos" | "sugestao" | "bug" | "elogio" | "outro";

const FILTERS: { key: Filter; label: string; countKey: keyof Counts }[] = [
  { key: "todos", label: "Todos", countKey: "total" },
  { key: "sugestao", label: "Sugestão", countKey: "sugestao" },
  { key: "bug", label: "Bug", countKey: "bug" },
  { key: "elogio", label: "Elogio", countKey: "elogio" },
  { key: "outro", label: "Outro", countKey: "outro" },
];

const CATEGORY_LABEL: Record<FeedbackEntry["category"], string> = {
  sugestao: "Sugestão",
  bug: "Bug",
  elogio: "Elogio",
  outro: "Outro",
};

const CATEGORY_STYLE: Record<FeedbackEntry["category"], string> = {
  sugestao: "bg-[color:var(--or)]/15 text-[color:var(--or)]",
  bug: "bg-red-500/15 text-red-300",
  elogio: "bg-[color:var(--gn)]/15 text-[color:var(--gn)]",
  outro: "bg-[color:var(--s3)] text-[color:var(--tx2)]",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function FeedbackList({
  entries,
  counts,
}: {
  entries: FeedbackEntry[];
  counts: Counts;
}) {
  const [filter, setFilter] = useState<Filter>("todos");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter((e) => {
      if (filter !== "todos" && e.category !== filter) return false;
      if (!q) return true;
      return (
        e.message.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q)
      );
    });
  }, [entries, filter, query]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`rounded-sm px-3 py-1.5 font-[family-name:var(--font-condensed)] text-[11px] font-bold uppercase tracking-[1.5px] transition-colors ${
                active
                  ? "bg-[color:var(--or)] text-black"
                  : "border border-[color:var(--bd)] bg-[color:var(--s2)] text-[color:var(--tx2)] hover:border-[color:var(--or)] hover:text-[color:var(--or)]"
              }`}
            >
              {f.label} · {counts[f.countKey]}
            </button>
          );
        })}
      </div>

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar por mensagem ou email…"
        className="w-full rounded-md border border-[color:var(--bd)] bg-[color:var(--s2)] px-3 py-2.5 text-sm text-[color:var(--tx)] placeholder:text-[color:var(--tx3)] focus:border-[color:var(--or)] focus:outline-none"
      />

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[color:var(--bd)] bg-[color:var(--s1)] p-8 text-center text-sm text-[color:var(--tx3)]">
          Nenhuma mensagem para esses filtros.
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((e) => (
            <li
              key={e.id}
              className="rounded-lg border border-[color:var(--bd)] bg-[color:var(--s1)] p-4"
            >
              <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px]">
                <span
                  className={`rounded-sm px-2 py-0.5 font-[family-name:var(--font-condensed)] font-bold uppercase tracking-[1.5px] ${CATEGORY_STYLE[e.category]}`}
                >
                  {CATEGORY_LABEL[e.category]}
                </span>
                <span className="text-[color:var(--tx3)]">
                  {formatDate(e.created_at)}
                </span>
                <span className="text-[color:var(--tx3)]">·</span>
                <a
                  href={`mailto:${e.email}?subject=${encodeURIComponent(
                    "Re: sua sugestão no FORTE 365",
                  )}`}
                  className="text-[color:var(--or)] hover:underline"
                >
                  {e.email}
                </a>
              </div>
              <p className="whitespace-pre-wrap text-sm text-[color:var(--tx)]">
                {e.message}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
