import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Anton, Barlow, Barlow_Condensed } from "next/font/google";
import "./globals.css";

const anton = Anton({
  weight: "400",
  variable: "--font-anton",
  subsets: ["latin"],
  display: "swap",
});

const barlow = Barlow({
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-barlow",
  subsets: ["latin"],
  display: "swap",
});

const barlowCondensed = Barlow_Condensed({
  weight: ["600", "700", "800"],
  variable: "--font-barlow-condensed",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "FORTE 365 — Calistenia em casa, 12 meses",
  description:
    "Plano anual de calistenia e nutrição em português. Funciona offline, custa R$14,90/mês.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "FORTE 365",
  },
};

export const viewport: Viewport = {
  themeColor: "#FF5500",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${anton.variable} ${barlow.variable} ${barlowCondensed.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded-md focus:bg-[color:var(--or)] focus:px-4 focus:py-2 focus:font-bold focus:text-black"
        >
          Pular para conteudo
        </a>
        {children}
        {process.env.NEXT_PUBLIC_POSTHOG_KEY && (
          <Script
            id="posthog"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.async=!0,p.src=s.api_host+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init capture register register_once register_for_session unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys onSessionId setPersonProperties".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
                posthog.init('${process.env.NEXT_PUBLIC_POSTHOG_KEY}',{api_host:'https://us.i.posthog.com',person_profiles:'identified_only'});
              `,
            }}
          />
        )}
      </body>
    </html>
  );
}
