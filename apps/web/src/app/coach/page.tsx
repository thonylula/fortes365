import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CoachChat } from "./coach-chat";

export const dynamic = "force-dynamic";

export default async function CoachPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/coach");

  const name = (user.user_metadata?.display_name as string) ?? user.email?.split("@")[0] ?? "Atleta";

  return (
    <div className="flex min-h-screen flex-col bg-[color:var(--bg)]">
      <header className="sticky top-0 z-20 flex h-[52px] items-center justify-between border-b border-[color:var(--bd)] bg-[color:var(--s1)] px-4">
        <Link href="/" className="logo">
          FORT<span>E</span>
          <sub>365</sub>
        </Link>
        <Link
          href="/treino"
          className="font-[family-name:var(--font-condensed)] text-[11px] font-bold uppercase tracking-[1.5px] text-[color:var(--or)]"
        >
          ← Treino
        </Link>
      </header>
      <CoachChat userName={name} />
    </div>
  );
}
