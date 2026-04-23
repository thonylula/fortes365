"use client";

import { useMemo, useState } from "react";

export type SubscriberEntry = {
  id: string;
  user_id: string;
  email: string;
  tier: string;
  status: string;
  computedStatus: "active" | "canceling" | "pending" | "expired" | "other";
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  days_remaining: number | null;
  created_at: string;
  updated_at: string;
};

type Counts = {
  total: number;
  active: number;
  canceling: number;
  pending: number;
  expired: number;
};

type Filter = "todos" | "active" | "canceling" | "pending" | "expired";

const FILTERS: { key: Filter; label: string; countKey: keyof Counts }[] = [
  { key: "todos", label: "Todas", countKey: "total" },
  { key: "active", label: "Ativas", countKey: "active" },
  { key: "canceling", label: "Cancelando", countKey: "canceling" },
  { key: "pending", label: "Pendentes", countKey: "pending" },
  { key: "expired", label: "Expiradas", countKey: "expired" },
];

const TIER_LABEL: Record<string, string> = {
  monthly: "Mensal",
  annual: "Anual",
  couple_monthly: "Casal Mensal",
  couple_annual: "Casal Anual",
};

const STATUS_STYLE: Record<SubscriberEntry["computedStatus"], string> = {
  active: "bg-[color:var(--gn)]/15 text-[color:var(--gn)]",
  canceling: "bg-[color:var(--yw)]/15 text-[color:var(--yw)]",
  pending: "bg-blue-500/15 text-blue-300",
  expired: "bg-[color:var(--s3)] text-[color:var(--tx3)]",
  other: "bg-[color:var(--s3)] text-[color:var(--tx2)]",
};

const STATUS_LABEL: Record<SubscriberEntry["computedStatus"], string> = {
  active: "Ativa",
  canceling: "Cancelando",
  pending: "Pendente",
  expired: "Expirada",
  other: "—",
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function SubscribersList({
  entries,
  counts,
}: {
  entries: SubscriberEntry[];
  counts: Counts;
}) {
  const [filter, setFilter] = useState<Filter>("todos");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter((e) => {
      if (filter !== "todos" && e.computedStatus !== filter) return false;
      if (!q) return true;
      return (
        e.email.toLowerCase().includes(q) ||
        e.tier.toLowerCase().includes(q)
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
        placeholder="Buscar por email ou plano…"
        className="w-full rounded-md border border-[color:var(--bd)] bg-[color:var(--s2)] px-3 py-2.5 text-sm text-[color:var(--tx)] placeholder:text-[color:var(--tx3)] focus:border-[color:var(--or)] focus:outline-none"
      />

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[color:var(--bd)] bg-[color:var(--s1)] p-8 text-center text-sm text-[color:var(--tx3)]">
          Nenhuma assinatura para esses filtros.
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((e) => (
            <li
              key={e.id}
              className="rounded-lg border border-[color:var(--bd)] bg-[color:var(--s1)] p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-[11px]">
                    <span
                      className={`rounded-sm px-2 py-0.5 font-[family-name:var(--font-condensed)] font-bold uppercase tracking-[1.5px] ${STATUS_STYLE[e.computedStatus]}`}
                    >
                      {STATUS_LABEL[e.computedStatus]}
                    </span>
                    <span className="rounded-sm bg-[color:var(--or)]/15 px-2 py-0.5 font-[family-name:var(--font-condensed)] font-bold uppercase tracking-[1.5px] text-[color:var(--or)]">
                      {TIER_LABEL[e.tier] ?? e.tier}
                    </span>
                  </div>
                  <a
                    href={`mailto:${e.email}`}
                    className="mt-2 block truncate text-sm font-semibold text-[color:var(--tx)] hover:text-[color:var(--or)] hover:underline"
                  >
                    {e.email}
                  </a>
                </div>

                <div className="shrink-0 text-right">
                  {e.days_remaining !== null && e.computedStatus !== "expired" ? (
                    <div>
                      <div
                        className="font-[family-name:var(--font-display)] text-2xl leading-none"
                        style={{
                          color:
                            e.days_remaining <= 7
                              ? "var(--yw)"
                              : "var(--gn)",
                        }}
                      >
                        {e.days_remaining}
                      </div>
                      <div className="mt-0.5 font-[family-name:var(--font-condensed)] text-[9px] font-bold uppercase tracking-[1.5px] text-[color:var(--tx3)]">
                        dias
                      </div>
                    </div>
                  ) : (
                    <div className="font-[family-name:var(--font-condensed)] text-[10px] font-bold uppercase tracking-[1.5px] text-[color:var(--tx3)]">
                      —
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 border-t border-[color:var(--bd)] pt-3 text-[11px] text-[color:var(--tx3)]">
                <div>
                  <span className="font-[family-name:var(--font-condensed)] uppercase tracking-[1.5px]">
                    Início:
                  </span>{" "}
                  {formatDate(e.current_period_start)}
                </div>
                <div>
                  <span className="font-[family-name:var(--font-condensed)] uppercase tracking-[1.5px]">
                    Fim do ciclo:
                  </span>{" "}
                  {formatDate(e.current_period_end)}
                </div>
                <div>
                  <span className="font-[family-name:var(--font-condensed)] uppercase tracking-[1.5px]">
                    Criada:
                  </span>{" "}
                  {formatDate(e.created_at)}
                </div>
                <div>
                  <span className="font-[family-name:var(--font-condensed)] uppercase tracking-[1.5px]">
                    Atualizada:
                  </span>{" "}
                  {formatDate(e.updated_at)}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
