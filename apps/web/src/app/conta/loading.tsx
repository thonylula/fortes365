import { SkeletonHeader, Skeleton, SkeletonKsBox } from "@/components/skeleton";

export default function ContaLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-[color:var(--bg)]">
      <SkeletonHeader />
      <div className="mx-auto w-full max-w-lg flex-1 px-6 py-10">
        <div className="skeleton mb-6 h-8 w-48 rounded" />
        <div className="space-y-4">
          <div className="rounded-lg border border-[color:var(--bd)] bg-[color:var(--s1)] p-5">
            <div className="flex items-center gap-4">
              <Skeleton width="56px" height="56px" rounded />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-5 w-32 rounded" />
                <div className="skeleton h-3 w-48 rounded" />
                <div className="skeleton h-3 w-28 rounded" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <SkeletonKsBox />
            <SkeletonKsBox />
            <SkeletonKsBox />
          </div>
          <div className="rounded-lg border border-[color:var(--bd)] bg-[color:var(--s1)] p-5">
            <div className="skeleton mb-3 h-4 w-24 rounded" />
            <div className="skeleton h-12 w-full rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}
