import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient as createServer } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { ensureAdmin } from "@/lib/admin";
import { FeedbackList, type FeedbackEntry } from "./feedback-list";

export const dynamic = "force-dynamic";

type FeedbackRow = {
  id: string;
  user_id: string;
  category: "sugestao" | "bug" | "elogio" | "outro";
  message: string;
  created_at: string;
};

export default async function AdminFeedbackPage() {
  const supabase = await createServer();
  const admin = await ensureAdmin(supabase);
  if (!admin.ok) redirect("/conta");

  const service = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: rows, error } = await service
    .from("feedback")
    .select("id, user_id, category, message, created_at")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col">
        <header className="flex h-[52px] items-center justify-between border-b border-[color:var(--bd)] bg-[color:var(--s1)] px-4">
          <Link href="/treino" className="logo">
            FORT<span>E</span>
            <sub>365</sub>
          </Link>
          <Link
            href="/conta"
            className="font-[family-name:var(--font-condensed)] text-[11px] font-bold uppercase tracking-[1.5px] text-[color:var(--or)]"
          >
            ← Conta
          </Link>
        </header>
        <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
          <p className="text-sm text-red-400">
            Erro ao carregar feedback: {error.message}
          </p>
        </main>
      </div>
    );
  }

  const entries: FeedbackRow[] = rows ?? [];
  const uniqueIds = Array.from(new Set(entries.map((e) => e.user_id)));

  const emailByUserId = new Map<string, string>();
  await Promise.all(
    uniqueIds.map(async (uid) => {
      const { data } = await service.auth.admin.getUserById(uid);
      if (data?.user?.email) emailByUserId.set(uid, data.user.email);
    }),
  );

  const enriched: FeedbackEntry[] = entries.map((e) => ({
    id: e.id,
    user_id: e.user_id,
    email: emailByUserId.get(e.user_id) ?? "(user removido)",
    category: e.category,
    message: e.message,
    created_at: e.created_at,
  }));

  const counts = {
    total: enriched.length,
    sugestao: enriched.filter((e) => e.category === "sugestao").length,
    bug: enriched.filter((e) => e.category === "bug").length,
    elogio: enriched.filter((e) => e.category === "elogio").length,
    outro: enriched.filter((e) => e.category === "outro").length,
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-[52px] items-center justify-between border-b border-[color:var(--bd)] bg-[color:var(--s1)] px-4">
        <Link href="/treino" className="logo">
          FORT<span>E</span>
          <sub>365</sub>
        </Link>
        <Link
          href="/conta"
          className="font-[family-name:var(--font-condensed)] text-[11px] font-bold uppercase tracking-[1.5px] text-[color:var(--or)]"
        >
          ← Conta
        </Link>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
        <div className="mb-6 flex items-baseline justify-between gap-3">
          <div>
            <div className="font-[family-name:var(--font-condensed)] text-[10px] font-bold uppercase tracking-[2px] text-[color:var(--or)]">
              🛠 Área DEV
            </div>
            <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-wider">
              SUGESTÕES
            </h1>
          </div>
          <div className="text-right text-xs text-[color:var(--tx3)]">
            Admin: {admin.email}
            <br />
            {counts.total} mensagens
          </div>
        </div>

        <FeedbackList entries={enriched} counts={counts} />
      </main>
    </div>
  );
}
