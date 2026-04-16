import Link from "next/link";

export function AchievementSummary({
  total,
  unlocked,
}: {
  total: number;
  unlocked: { emoji: string; title: string }[];
}) {
  return (
    <div className="rounded-lg border border-[color:var(--bd)] bg-[color:var(--s1)] p-5">
      <div className="flex items-center justify-between">
        <div className="slbl">
          Conquistas
          <span className="ml-2 text-[10px] font-normal normal-case tracking-normal text-[color:var(--tx3)]">
            {unlocked.length}/{total}
          </span>
        </div>
        <Link
          href="/conquistas"
          className="font-[family-name:var(--font-condensed)] text-[10px] font-bold uppercase tracking-wider text-[color:var(--or)]"
        >
          Ver todas →
        </Link>
      </div>

      {unlocked.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {unlocked.map((a, i) => (
            <div
              key={i}
              className="flex items-center gap-1 rounded-md border border-[color:var(--or)]/30 bg-[color:var(--ord)] px-2 py-1"
              title={a.title}
            >
              <span className="text-sm">{a.emoji}</span>
              <span className="font-[family-name:var(--font-condensed)] text-[10px] font-bold uppercase tracking-wider">
                {a.title}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-xs text-[color:var(--tx3)]">
          Nenhuma conquista desbloqueada ainda. Complete treinos para ganhar badges!
        </p>
      )}
    </div>
  );
}
