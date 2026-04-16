import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { QuizFlow } from "./quiz-flow";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/onboarding");

  // Try to fetch onboarding columns — if migration not applied, use defaults
  let initialData: Record<string, unknown> = {};

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!error && profile) {
    if (profile.onboarding_completed) redirect("/treino");

    for (const [key, val] of Object.entries(profile)) {
      if (val != null && key !== "onboarding_completed" && key !== "id" && key !== "created_at" && key !== "updated_at") {
        initialData[key] = val;
      }
    }
  }

  return <QuizFlow initialData={initialData} />;
}
