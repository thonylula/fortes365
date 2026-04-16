import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";
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
      <Header backLink={{ href: "/treino", label: "← Treino" }} />
      <CoachChat userName={name} />
    </div>
  );
}
