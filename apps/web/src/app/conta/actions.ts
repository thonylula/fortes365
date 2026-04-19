"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { sendAccountDeletedEmail } from "@/lib/email";

export async function exportUserData() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const [
    { data: profile },
    { data: progress },
    { data: workouts },
    { data: achievements },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("user_progress").select("*").eq("user_id", user.id).single(),
    supabase.from("workout_sessions").select("*").eq("user_id", user.id),
    supabase.from("user_achievements").select("*").eq("user_id", user.id),
  ]);

  return {
    exported_at: new Date().toISOString(),
    user: { id: user.id, email: user.email, created_at: user.created_at },
    profile,
    progress,
    workouts: workouts ?? [],
    achievements: achievements ?? [],
  };
}

export async function deleteAccount() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const email = user.email;

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  await admin.from("push_subscriptions").delete().eq("user_id", user.id);
  await admin.from("user_achievements").delete().eq("user_id", user.id);
  await admin.from("workout_sessions").delete().eq("user_id", user.id);
  await admin.from("user_progress").delete().eq("user_id", user.id);
  await admin.from("meal_log").delete().eq("user_id", user.id);
  await admin.from("subscriptions").delete().eq("user_id", user.id);
  await admin.from("profiles").delete().eq("id", user.id);
  await admin.auth.admin.deleteUser(user.id);

  if (email) {
    try {
      await sendAccountDeletedEmail(email);
    } catch (err) {
      console.error("[conta/actions] deletion email failed:", err);
    }
  }

  return { ok: true };
}

export async function saveReview(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const rating = Number(formData.get("rating"));
  const body = String(formData.get("body") ?? "").trim().slice(0, 500);

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    redirect("/conta?reviewError=Selecione+uma+nota+de+1+a+5");
  }

  const { error } = await supabase.from("reviews").upsert(
    {
      user_id: user.id,
      rating,
      body,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) {
    redirect(`/conta?reviewError=${encodeURIComponent(error.message)}`);
  }

  redirect("/conta?reviewSaved=1");
}
