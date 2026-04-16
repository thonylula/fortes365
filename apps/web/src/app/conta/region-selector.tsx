"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";

const REGIONS = [
  { value: "nordeste", label: "Nordeste", emoji: "🌵" },
  { value: "sudeste", label: "Sudeste", emoji: "🏙️" },
  { value: "sul", label: "Sul", emoji: "🧉" },
  { value: "norte", label: "Norte", emoji: "🌳" },
  { value: "centro_oeste", label: "Centro-Oeste", emoji: "🌾" },
] as const;

export function RegionSelector({ currentRegion }: { currentRegion: string | null }) {
  const [region, setRegion] = useState(currentRegion);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleChange = (value: string) => {
    setRegion(value);
    setSaved(false);
    startTransition(async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from("profiles")
        .update({ region: value })
        .eq("id", user.id);

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  };

  return (
    <div className="rounded-lg border border-[color:var(--bd)] bg-[color:var(--s1)] p-5">
      <div className="slbl mb-3">
        Sua região
        {saved && (
          <span className="ml-2 text-[10px] font-normal normal-case tracking-normal text-[color:var(--gn)]">
            ✓ salvo
          </span>
        )}
      </div>
      <p className="mb-3 text-xs text-[color:var(--tx3)]">
        O coach IA adapta a linguagem e gírias da sua região.
      </p>
      <div className="flex flex-wrap gap-2">
        {REGIONS.map((r) => (
          <button
            key={r.value}
            onClick={() => handleChange(r.value)}
            disabled={isPending}
            className="chipbtn flex items-center gap-1.5"
            data-active={region === r.value}
          >
            <span>{r.emoji}</span>
            {r.label}
          </button>
        ))}
      </div>
    </div>
  );
}
