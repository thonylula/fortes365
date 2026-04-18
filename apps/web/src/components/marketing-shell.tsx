import Link from "next/link";
import type { ReactNode } from "react";

export function MarketingShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[color:var(--bg)]">
      <MinimalHeader />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <SharedFooter />
    </div>
  );
}

function MinimalHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-[color:var(--bd)] bg-[color:var(--bg)]/92 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link href="/" className="logo">
          FORT<span>E</span>
          <sub>365</sub>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="hidden rounded-sm px-3 py-1.5 font-[family-name:var(--font-condensed)] text-[11px] font-bold uppercase tracking-[2px] text-[color:var(--tx2)] transition-colors hover:text-[color:var(--tx)] sm:inline-flex"
          >
            Entrar
          </Link>
          <Link
            href="/cadastro"
            className="inline-flex items-center rounded-sm bg-[color:var(--or)] px-3.5 py-1.5 font-[family-name:var(--font-condensed)] text-[11px] font-bold uppercase tracking-[2px] text-black transition-colors hover:bg-[#ff7733]"
          >
            Começar grátis
          </Link>
        </div>
      </div>
    </header>
  );
}

function SharedFooter() {
  return (
    <footer className="border-t border-[color:var(--bd)] bg-[color:var(--s1)]">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-5">
            <Link href="/" className="logo">
              FORT<span>E</span>
              <sub>365</sub>
            </Link>
            <p className="mt-3 max-w-sm text-[13px] leading-relaxed text-[color:var(--tx3)]">
              Programa de calistenia periodizada em português. Produto
              independente, feito no Brasil.
            </p>
          </div>

          <FooterColumn
            title="Produto"
            items={[
              ["Cadastro", "/cadastro"],
              ["Entrar", "/login"],
              ["Planos", "/assinar"],
              ["FAQ", "/#faq"],
            ]}
          />

          <FooterColumn
            title="Empresa"
            items={[
              ["Sobre", "/sobre"],
              ["Contato", "mailto:contato@fortes365.com.br"],
              ["Privacidade", "/privacidade"],
              ["Termos", "/termos"],
            ]}
          />
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-[color:var(--bd)] pt-6 font-[family-name:var(--font-condensed)] text-[10px] uppercase tracking-[2px] text-[color:var(--tx3)] sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 FORTE 365 · Todos os direitos reservados</span>
          <span>Brasil · pt-BR</span>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  items,
}: {
  title: string;
  items: Array<[string, string]>;
}) {
  return (
    <nav className="md:col-span-3" aria-label={title}>
      <div className="font-[family-name:var(--font-condensed)] text-[10px] font-bold uppercase tracking-[2.5px] text-[color:var(--tx3)]">
        {title}
      </div>
      <ul className="mt-4 space-y-2.5">
        {items.map(([label, href]) => (
          <li key={label}>
            <Link
              href={href}
              className="text-[13px] text-[color:var(--tx2)] transition-colors hover:text-[color:var(--or)]"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function LegalHeader({
  eyebrow,
  title,
  updated,
}: {
  eyebrow: string;
  title: string;
  updated: string;
}) {
  return (
    <header className="border-b border-[color:var(--bd)]">
      <div className="mx-auto max-w-4xl px-5 py-16 sm:px-8 sm:py-20">
        <div className="flex items-center gap-3 font-[family-name:var(--font-condensed)] text-[11px] font-bold uppercase tracking-[3px] text-[color:var(--or)]">
          <span className="h-px w-8 bg-[color:var(--or)]" aria-hidden="true" />
          {eyebrow}
        </div>
        <h1 className="mt-6 font-[family-name:var(--font-display)] text-4xl leading-[0.98] tracking-wide sm:text-6xl">
          {title}
        </h1>
        <p className="mt-5 font-[family-name:var(--font-condensed)] text-[11px] uppercase tracking-[2px] text-[color:var(--tx3)]">
          Última atualização · {updated}
        </p>
      </div>
    </header>
  );
}

export function LegalSection({
  index,
  title,
  children,
}: {
  index: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="border-b border-[color:var(--bd)]">
      <div className="mx-auto grid max-w-4xl gap-8 px-5 py-12 sm:px-8 sm:py-14 md:grid-cols-12">
        <div className="md:col-span-3">
          <div className="font-[family-name:var(--font-display)] text-2xl leading-none tracking-wider text-[color:var(--or)]">
            §{index}
          </div>
          <h2 className="mt-3 font-[family-name:var(--font-condensed)] text-sm font-bold uppercase tracking-[2.5px] text-[color:var(--tx)]">
            {title}
          </h2>
        </div>
        <div className="space-y-4 text-[15px] leading-[1.75] text-[color:var(--tx2)] md:col-span-9">
          {children}
        </div>
      </div>
    </section>
  );
}
