import { createClient } from "@/lib/supabase/server";

export type AuthDisplay = { firstName: string; email: string } | null;

export async function getAuthDisplay(): Promise<AuthDisplay> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  const displayName = profile?.display_name?.trim();
  const firstName = displayName
    ? displayName.split(/\s+/)[0]
    : user.email.split("@")[0];

  return { firstName, email: user.email };
}
