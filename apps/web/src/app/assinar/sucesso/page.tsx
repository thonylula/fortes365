import Link from "next/link";

export default function SucessoPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[color:var(--bg)]">
      <header className="flex h-[52px] items-center border-b border-[color:var(--bd)] bg-[color:var(--s1)] px-4">
        <Link href="/" className="logo">
          FORT<span>E</span>
          <sub>365</sub>
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-6 py-12 text-center">
        <div className="mb-4 text-5xl">🎉</div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-wider text-[color:var(--gn)]">
          ASSINATURA ATIVA!
        </h1>
        <p className="mt-3 text-sm text-[color:var(--tx2)]">
          Pagamento confirmado. Você agora tem acesso completo aos 12 meses de
          treino, nutrição, receitas e lista de compras.
        </p>

        <Link
          href="/treino"
          className="mt-8 inline-flex h-12 items-center gap-2 rounded-md bg-[color:var(--or)] px-8 font-[family-name:var(--font-condensed)] text-sm font-bold uppercase tracking-[1.5px] text-black transition-colors hover:bg-[#ff7733]"
        >
          Ir para o treino →
        </Link>

        <p className="mt-4 text-xs text-[color:var(--tx3)]">
          Pode levar até 1 minuto para o sistema processar o pagamento.
          Se os meses ainda aparecerem bloqueados, recarregue a página.
        </p>
      </main>
    </div>
  );
}
