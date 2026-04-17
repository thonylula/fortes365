import { SkeletonHeader, SkeletonNavTabs } from "@/components/skeleton";

export default function LeaderboardLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-[color:var(--bg)]">
      <SkeletonHeader />
      <SkeletonNavTabs />
      <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">
        <div className="skeleton mx-auto mb-6 h-8 w-40 rounded" />
        <div className="mb-6 flex justify-center gap-2">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="skeleton h-8 w-20 rounded-full" />
          ))}
        </div>
        <div className="mb-6 flex justify-center gap-4">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="skeleton h-28 w-24 rounded-xl" />
          ))}
        </div>
        <div className="space-y-2">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="skeleton h-14 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
