import { SkeletonHeader, SkeletonNavTabs, SkeletonKsBox } from "@/components/skeleton";

export default function ProgressoLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-[color:var(--bg)]">
      <SkeletonHeader />
      <SkeletonNavTabs />
      <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
        <div className="skeleton mx-auto mb-6 h-8 w-48 rounded" />
        <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <SkeletonKsBox />
          <SkeletonKsBox />
          <SkeletonKsBox />
          <SkeletonKsBox />
        </div>
        <div className="skeleton mb-4 h-48 w-full rounded-xl" />
        <div className="skeleton h-48 w-full rounded-xl" />
      </div>
    </div>
  );
}
