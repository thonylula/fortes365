import Link from "next/link";

export function EmptyState({
  emoji,
  title,
  description,
  cta,
}: {
  emoji: string;
  title: string;
  description: string;
  cta?: { href: string; label: string };
}) {
  return (
    <div className="rounded-xl border border-[color:var(--bd)] bg-[color:var(--s1)] px-6 py-10 text-center">
      <div className="mb-3 text-4xl">{emoji}</div>
      <h3 className="mb-1 font-[family-name:var(--font-display)] text-lg tracking-wider">
        {title}
      </h3>
      <p className="text-sm text-[color:var(--tx2)]">{description}</p>
      {cta && (
        <Link
          href={cta.href}
          className="mt-4 inline-block rounded-md bg-[color:var(--or)] px-5 py-2 font-[family-name:var(--font-condensed)] text-sm font-bold uppercase tracking-wider text-white transition-opacity hover:opacity-90"
        >
          {cta.label}
        </Link>
      )}
    </div>
  );
}
