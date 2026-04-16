import type { Metadata, Viewport } from "next";
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
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
