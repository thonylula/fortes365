import { SkeletonHeader, SkeletonNavTabs } from "@/components/skeleton";

export default function SkillsLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-[color:var(--bg)]">
      <SkeletonHeader />
      <SkeletonNavTabs />
      <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
        <div className="skeleton mx-auto mb-4 h-8 w-48 rounded" />
        <div className="mb-6 flex justify-center gap-2">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="skeleton h-7 w-16 rounded-full" />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {Array.from({ length: 12 }, (_, i) => (
            <div key={i} className="skeleton h-24 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
