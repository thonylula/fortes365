import {
  SkeletonHeader,
  SkeletonNavTabs,
  SkeletonChipStrip,
} from "@/components/skeleton";

export default function ComprasLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-[color:var(--bg)]">
      <SkeletonHeader />
      <SkeletonNavTabs />
      <SkeletonChipStrip count={6} />
      <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-4">
        {[1, 2].map((g) => (
          <div key={g} className="mb-6">
            <div className="skeleton mb-3 h-4 w-32 rounded" />
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="rounded-lg border border-[color:var(--bd)] bg-[color:var(--s1)] p-3">
                  <div className="skeleton mb-1 h-3 w-3/4 rounded" />
                  <div className="skeleton h-2 w-1/2 rounded" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
