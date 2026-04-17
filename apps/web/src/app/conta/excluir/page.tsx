import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";
import { DeleteAccountForm } from "./delete-form";

export const dynamic = "force-dynamic";

export default async function ExcluirContaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen flex-col">
      <Header backLink={{ href: "/conta", label: "← Conta" }} />
      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-12">
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-6 text-center">
          <div className="mb-3 text-4xl">⚠️</div>
          <h1 className="mb-2 font-[family-name:var(--font-display)] text-2xl tracking-wider text-red-400">
            EXCLUIR CONTA
          </h1>
          <p className="mb-6 text-sm leading-relaxed text-[color:var(--tx2)]">
            Esta acao e irreversivel. Todos os seus dados serao permanentemente removidos:
            perfil, treinos, conquistas, progresso e assinatura.
          </p>
          <DeleteAccountForm />
        </div>
      </main>
    </div>
  );
}
