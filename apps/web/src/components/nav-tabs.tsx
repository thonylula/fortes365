"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/treino", icon: "💪", label: "Treino" },
  { href: "/nutricao", icon: "🥗", label: "Nutrição" },
  { href: "/receitas", icon: "📖", label: "Receitas" },
  { href: "/compras", icon: "🛒", label: "Compras" },
  { href: "/conquistas", icon: "🏆", label: "Conquistas" },
  { href: "/coach", icon: "🤖", label: "Coach IA" },
] as const;

export function NavTabs() {
  const pathname = usePathname();

  return (
    <nav className="flex overflow-x-auto border-b border-[color:var(--bd)] bg-[color:var(--s1)]">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="flex min-w-[56px] flex-1 flex-col items-center gap-0.5 border-b-2 px-1 py-2 transition-colors"
            style={{
              borderBottomColor: active ? "var(--or)" : "transparent",
              color: active ? "var(--tx)" : "var(--tx2)",
              background: "none",
            }}
          >
            <span className="text-sm">{tab.icon}</span>
            <span className="font-[family-name:var(--font-barlow)] text-[9px] font-semibold uppercase tracking-[1px]">
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
