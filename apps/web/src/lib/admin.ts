import type { SupabaseClient } from "@supabase/supabase-js";

function getAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS ?? "";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export async function ensureAdmin(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, "public", any>,
): Promise<{ ok: true; email: string } | { ok: false; reason: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { ok: false, reason: "unauthenticated" };

  const admins = getAdminEmails();
  if (admins.length === 0) return { ok: false, reason: "no_admins_configured" };
  if (!admins.includes(user.email.toLowerCase())) {
    return { ok: false, reason: "not_admin" };
  }
  return { ok: true, email: user.email };
}
