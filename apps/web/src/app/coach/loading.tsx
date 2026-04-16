import { SkeletonHeader } from "@/components/skeleton";

export default function CoachLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-[color:var(--bg)]">
      <SkeletonHeader />
      <div className="flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <svg className="h-8 w-8 animate-[spin_0.6s_linear_infinite] text-[color:var(--or)]" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="50 20" />
          </svg>
          <span className="font-[family-name:var(--font-condensed)] text-xs uppercase tracking-widest text-[color:var(--tx3)]">
            Carregando coach...
          </span>
        </div>
      </div>
    </div>
  );
}
