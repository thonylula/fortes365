import type { Metadata } from "next";
import Link from "next/link";
import { signup } from "../login/actions";

export const metadata: Metadata = {
  title: "Criar conta · Nível 1 grátis",
  description:
    "Crie sua conta no FORTE 365 e comece o programa de calistenia: Nível 1 completo grátis, sem cartão.",
  alternates: { canonical: "/cadastro" },
};

export default async function CadastroPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { error, success } = await searchParams;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-[52px] items-center border-b border-[color:var(--bd)] bg-[color:var(--s1)] px-4">
        <Link href="/" className="logo">
          FORT<span>E</span>
          <sub>365</sub>
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-12">
        <h1 className="mb-1 font-[family-name:var(--font-display)] text-3xl tracking-wider">
          CRIAR CONTA
        </h1>
        <p className="mb-6 text-sm text-[color:var(--tx2)]">
          Comece gratis — Nível 1 liberado, sem cartao.
        </p>

        {error && (
          <div className="mb-4 rounded-md border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-md border border-[color:var(--gn)]/40 bg-[color:var(--gn)]/10 px-4 py-3 text-sm text-[color:var(--gn)]">
            <p className="font-semibold">Conta criada!</p>
            <p className="mt-1 text-xs">
              Confira seu email para ativar a conta, depois{" "}
              <Link href="/login" className="font-bold underline">
                faça login
              </Link>
              .
            </p>
          </div>
        )}

        {!success && (
          <form action={signup} className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="mb-1 block font-[family-name:var(--font-condensed)] text-[11px] font-bold uppercase tracking-wider text-[color:var(--tx3)]"
              >
                Seu nome
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                className="w-full rounded-md border border-[color:var(--bd)] bg-[color:var(--s2)] px-3 py-2.5 text-sm text-[color:var(--tx)] placeholder:text-[color:var(--tx3)] focus:border-[color:var(--or)] focus:outline-none"
                placeholder="Nome"
              />
            </div>
            <div>
              <label
                htmlFor="email"
                className="mb-1 block font-[family-name:var(--font-condensed)] text-[11px] font-bold uppercase tracking-wider text-[color:var(--tx3)]"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="w-full rounded-md border border-[color:var(--bd)] bg-[color:var(--s2)] px-3 py-2.5 text-sm text-[color:var(--tx)] placeholder:text-[color:var(--tx3)] focus:border-[color:var(--or)] focus:outline-none"
                placeholder="seu@email.com"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="mb-1 block font-[family-name:var(--font-condensed)] text-[11px] font-bold uppercase tracking-wider text-[color:var(--tx3)]"
              >
                Senha (mínimo 6 caracteres)
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="new-password"
                minLength={6}
                className="w-full rounded-md border border-[color:var(--bd)] bg-[color:var(--s2)] px-3 py-2.5 text-sm text-[color:var(--tx)] placeholder:text-[color:var(--tx3)] focus:border-[color:var(--or)] focus:outline-none"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-md bg-[color:var(--or)] py-2.5 font-[family-name:var(--font-condensed)] text-sm font-bold uppercase tracking-wider text-black transition-colors hover:bg-[#ff7733]"
            >
              Criar conta grátis
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-[color:var(--tx2)]">
          Já tem conta?{" "}
          <Link
            href="/login"
            className="font-semibold text-[color:var(--or)] hover:underline"
          >
            Faça login
          </Link>
        </p>
      </main>
    </div>
  );
}
