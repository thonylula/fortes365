import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-[52px] items-center justify-between border-b border-[color:var(--bd)] bg-[color:var(--s1)] px-4">
        <div className="logo">
          FORT<span>E</span>
          <sub>365</sub>
        </div>
        <Link
          href="/treino"
          className="font-[family-name:var(--font-condensed)] text-[11px] font-bold uppercase tracking-[1.5px] text-[color:var(--or)]"
        >
          Entrar →
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-10 px-6 py-12">
        <section className="space-y-4">
          <p className="font-[family-name:var(--font-condensed)] text-[11px] font-bold uppercase tracking-[3px] text-[color:var(--or)]">
            Calistenia periodizada em pt-BR
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-5xl leading-[0.95] tracking-wide sm:text-6xl">
            12 MESES
            <br />
            <span className="text-[color:var(--or)]">DE TREINO</span>
            <br />
            EM CASA
          </h1>
          <p className="max-w-xl text-base text-[color:var(--tx2)]">
            Quatro fases progressivas, nutrição adaptada à safra brasileira, coach IA em
            português e funciona offline. Pensado pra quem treina em casa, sem academia.
          </p>
        </section>

        <section className="grid gap-2 sm:grid-cols-3">
          <PriceCard label="Grátis" value="R$ 0" detail="Meses 1 e 2 · para sempre" />
          <PriceCard
            label="Mensal"
            value="R$ 14,90"
            detail="12 meses + coach IA"
            highlight
          />
          <PriceCard label="Anual" value="R$ 99,90" detail="~R$ 8,30/mês · 44% off" />
        </section>

        <section className="flex flex-wrap items-center gap-4">
          <Link
            href="/treino"
            className="inline-flex h-12 items-center gap-2 rounded-md bg-[color:var(--or)] px-6 font-[family-name:var(--font-condensed)] text-sm font-bold uppercase tracking-[1.5px] text-black transition-colors hover:bg-[#ff7733]"
          >
            Ver plano de treino
            <span aria-hidden>→</span>
          </Link>
          <span className="text-[11px] uppercase tracking-wider text-[color:var(--tx3)]">
            Sem cartão · Pix aceito
          </span>
        </section>
      </main>

      <footer className="border-t border-[color:var(--bd)] bg-[color:var(--s1)] px-6 py-5">
        <div className="mx-auto flex max-w-3xl items-center justify-between text-[11px] text-[color:var(--tx3)]">
          <span>FORTE 365 · Luanthony & Jéssica</span>
          <span>MVP · Fase 0</span>
        </div>
      </footer>
    </div>
  );
}

function PriceCard({
  label,
  value,
  detail,
  highlight,
}: {
  label: string;
  value: string;
  detail: string;
  highlight?: boolean;
}) {
  return (
    <div
      className="rounded-lg p-4 transition-colors"
      style={{
        border: `1.5px solid ${highlight ? "var(--or)" : "var(--bd)"}`,
        background: highlight ? "var(--ord)" : "var(--s1)",
      }}
    >
      <p className="font-[family-name:var(--font-condensed)] text-[10px] font-bold uppercase tracking-[1.5px] text-[color:var(--tx3)]">
        {label}
      </p>
      <p className="mt-1 font-[family-name:var(--font-display)] text-3xl tracking-wider">
        {value}
      </p>
      <p className="text-[11px] text-[color:var(--tx2)]">{detail}</p>
    </div>
  );
}
