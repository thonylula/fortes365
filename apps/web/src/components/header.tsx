import Link from "next/link";

type UserInfo = { email: string; name?: string } | null;

export function Header({
  user,
  backLink,
}: {
  user?: UserInfo;
  backLink?: { href: string; label: string };
}) {
  const initial = user
    ? (user.name ?? user.email).charAt(0).toUpperCase()
    : null;

  return (
    <header className="sticky top-0 z-20 flex h-[52px] items-center justify-between border-b border-[color:var(--bd)] bg-[color:var(--s1)] px-4">
      <Link href="/" className="logo">
        FORT<span>E</span>
        <sub>365</sub>
      </Link>
      <div className="flex items-center gap-2">
        {backLink && (
          <Link
            href={backLink.href}
            className="font-[family-name:var(--font-condensed)] text-[11px] font-bold uppercase tracking-[1.5px] text-[color:var(--or)]"
          >
            {backLink.label}
          </Link>
        )}
        {!backLink && user ? (
          <Link
            href="/conta"
            className="flex items-center gap-2 rounded-md border border-[color:var(--or)] bg-[color:var(--ord)] px-2.5 py-1 transition-colors hover:bg-[color:var(--or)] hover:text-black"
          >
            <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-[color:var(--ord)] font-[family-name:var(--font-display)] text-[9px] text-[color:var(--or)]">
              {initial}
            </span>
            <span className="text-[11px] font-semibold">
              {user.name ?? user.email.split("@")[0]}
            </span>
          </Link>
        ) : !backLink ? (
          <Link
            href="/login"
            className="rounded-md border border-[color:var(--or)] bg-[color:var(--ord)] px-3 py-1.5 font-[family-name:var(--font-condensed)] text-[11px] font-bold uppercase tracking-wider text-[color:var(--or)] transition-colors hover:bg-[color:var(--or)] hover:text-black"
          >
            Entrar
          </Link>
        ) : null}
      </div>
    </header>
  );
}
