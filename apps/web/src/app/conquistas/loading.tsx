import {
  SkeletonHeader,
  SkeletonNavTabs,
  SkeletonAchievementCard,
} from "@/components/skeleton";

export default function ConquistasLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-[color:var(--bg)]">
      <SkeletonHeader />
      <SkeletonNavTabs />
      <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">
        <div className="skeleton mx-auto mb-2 h-8 w-48 rounded" />
        <div className="mx-auto mb-6 flex max-w-[200px] items-center gap-2">
          <div className="skeleton h-2 flex-1 rounded-full" />
          <div className="skeleton h-4 w-10 rounded" />
        </div>
        {[1, 2].map((g) => (
          <div key={g} className="mb-6">
            <div className="skeleton mb-3 h-4 w-28 rounded" />
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <SkeletonAchievementCard />
              <SkeletonAchievementCard />
              <SkeletonAchievementCard />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
