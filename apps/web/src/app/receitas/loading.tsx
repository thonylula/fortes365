import {
  SkeletonHeader,
  SkeletonNavTabs,
  SkeletonRecipeCard,
} from "@/components/skeleton";

export default function ReceitasLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-[color:var(--bg)]">
      <SkeletonHeader />
      <SkeletonNavTabs />
      <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">
        <div className="skeleton mx-auto mb-6 h-8 w-40 rounded" />
        <div className="skeleton mx-auto mb-6 h-10 w-full rounded-lg" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <SkeletonRecipeCard />
          <SkeletonRecipeCard />
          <SkeletonRecipeCard />
          <SkeletonRecipeCard />
          <SkeletonRecipeCard />
          <SkeletonRecipeCard />
        </div>
      </div>
    </div>
  );
}
