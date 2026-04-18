import type { Metadata } from "next";
import Link from "next/link";
import { login } from "./actions";

export const metadata: Metadata = {
  title: "Entrar",
  description: "Acesse sua conta no FORTE 365 para continuar seu programa de calistenia.",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;

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
          ENTRAR
        </h1>
        <p className="mb-6 text-sm text-[color:var(--tx2)]">
          Acesse seu plano de treino e progresso.
        </p>

        {error && (
          <div className="mb-4 rounded-md border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <form action={login} className="space-y-4">
          {next && <input type="hidden" name="next" value={next} />}
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
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              minLength={6}
              className="w-full rounded-md border border-[color:var(--bd)] bg-[color:var(--s2)] px-3 py-2.5 text-sm text-[color:var(--tx)] placeholder:text-[color:var(--tx3)] focus:border-[color:var(--or)] focus:outline-none"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-md bg-[color:var(--or)] py-2.5 font-[family-name:var(--font-condensed)] text-sm font-bold uppercase tracking-wider text-black transition-colors hover:bg-[#ff7733]"
          >
            Entrar
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[color:var(--tx2)]">
          Não tem conta?{" "}
          <Link
            href="/cadastro"
            className="font-semibold text-[color:var(--or)] hover:underline"
          >
            Crie agora — é grátis
          </Link>
        </p>
      </main>
    </div>
  );
}
