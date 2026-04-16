import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthPage =
    request.nextUrl.pathname === "/login" ||
    request.nextUrl.pathname === "/cadastro";

  const isProtectedRoute =
    request.nextUrl.pathname === "/conta" ||
    request.nextUrl.pathname.startsWith("/conta/");

  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/treino";
    return NextResponse.redirect(url);
  }

  // Onboarding redirect: force new users through the quiz
  const isOnboardingPage = request.nextUrl.pathname === "/onboarding";
  const isApiRoute = request.nextUrl.pathname.startsWith("/api/");
  const isCallbackRoute = request.nextUrl.pathname === "/auth/callback";
  const isStaticRoute = request.nextUrl.pathname === "/" || request.nextUrl.pathname.startsWith("/_next");

  if (user && !isAuthPage && !isApiRoute && !isCallbackRoute && !isStaticRoute) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("id", user.id)
      .single();

    if (profile && !profile.onboarding_completed && !isOnboardingPage) {
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding";
      return NextResponse.redirect(url);
    }

    if (profile?.onboarding_completed && isOnboardingPage) {
      const url = request.nextUrl.clone();
      url.pathname = "/treino";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
