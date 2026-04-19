import { createClient } from "@/lib/supabase/server";

export type ReviewStats = { count: number; average: number };

export type RecentReview = {
  rating: number;
  body: string;
  firstName: string;
  created_at: string;
};

export type MyReview = { rating: number; body: string };

function firstNameOf(displayName: string | null | undefined): string {
  if (!displayName) return "Usuário";
  const trimmed = displayName.trim();
  if (!trimmed) return "Usuário";
  const first = trimmed.split(/\s+/)[0];
  return first.length > 20 ? first.slice(0, 20) : first;
}

export async function getReviewStats(): Promise<ReviewStats> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reviews")
    .select("rating");
  if (error || !data || data.length === 0) {
    return { count: 0, average: 0 };
  }
  const total = data.reduce((sum, r) => sum + (r.rating ?? 0), 0);
  return {
    count: data.length,
    average: total / data.length,
  };
}

export async function getRecentReviews(limit = 3): Promise<RecentReview[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reviews")
    .select("rating, body, created_at, profiles!inner(display_name)")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return (data as unknown as Array<{
    rating: number;
    body: string;
    created_at: string;
    profiles: { display_name: string | null } | { display_name: string | null }[] | null;
  }>).map((r) => {
    const profile = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
    return {
      rating: r.rating,
      body: r.body,
      firstName: firstNameOf(profile?.display_name),
      created_at: r.created_at,
    };
  });
}

export async function getMyReview(): Promise<MyReview | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from("reviews")
    .select("rating, body")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error || !data) return null;
  return { rating: data.rating, body: data.body };
}
