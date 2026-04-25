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

  const path = request.nextUrl.pathname;

  const isAuthPage = path === "/login" || path === "/cadastro";
  const isProtectedRoute = path === "/conta" || path.startsWith("/conta/");

  // Rotas que exigem onboarding completo (consumo do app). Demais rotas
  // (/login, /cadastro, /onboarding, /conta, /assinar, /admin, /api, /, etc)
  // seguem livres pra usuário começar/continuar fluxo de cadastro/edição.
  const requiresOnboarding =
    path === "/treino" || path.startsWith("/treino/") ||
    path === "/nutricao" || path.startsWith("/nutricao/") ||
    path === "/compras" || path.startsWith("/compras/") ||
    path === "/receitas" || path.startsWith("/receitas/") ||
    path === "/skills" || path.startsWith("/skills/") ||
    path === "/ranking" || path.startsWith("/ranking/") ||
    path === "/progresso" || path.startsWith("/progresso/") ||
    path === "/coach" || path.startsWith("/coach/");

  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/treino";
    return NextResponse.redirect(url);
  }

  // Gate de onboarding: user logado tentando acessar rota de consumo sem
  // ter completado o quiz é redirecionado pra /onboarding. Verifica via
  // coluna `onboarding_completed` (boolean simples — barato).
  if (user && requiresOnboarding) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("id", user.id)
      .maybeSingle();
    if (!profile?.onboarding_completed) {
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
