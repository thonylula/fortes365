"use server";

import { createClient } from "./server";

export type SubscriptionInfo = {
  isLoggedIn: boolean;
  isPremium: boolean;
  tier: string;
  freeMonths: number[];
};

const FREE_MONTHS = [0]; // Janeiro

export async function getSubscriptionInfo(): Promise<SubscriptionInfo> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { isLoggedIn: false, isPremium: false, tier: "anonymous", freeMonths: FREE_MONTHS };
  }

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("tier, status, current_period_end")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!sub) {
    return { isLoggedIn: true, isPremium: false, tier: "free", freeMonths: FREE_MONTHS };
  }

  const isExpired = sub.current_period_end
    ? new Date(sub.current_period_end) < new Date()
    : false;

  if (isExpired) {
    return { isLoggedIn: true, isPremium: false, tier: "expired", freeMonths: FREE_MONTHS };
  }

  return { isLoggedIn: true, isPremium: true, tier: sub.tier, freeMonths: FREE_MONTHS };
}

