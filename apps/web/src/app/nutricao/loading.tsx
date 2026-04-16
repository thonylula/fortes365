import {
  SkeletonHeader,
  SkeletonNavTabs,
  SkeletonChipStrip,
  SkeletonDayStrip,
  SkeletonKsBox,
  SkeletonMealCard,
} from "@/components/skeleton";

export default function NutricaoLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-[color:var(--bg)]">
      <SkeletonHeader />
      <SkeletonNavTabs />
      <SkeletonChipStrip count={6} />
      <SkeletonDayStrip />
      <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-4">
        <div className="mb-4 grid grid-cols-2 gap-2">
          <SkeletonKsBox />
          <SkeletonKsBox />
        </div>
        <div className="space-y-3">
          <SkeletonMealCard />
          <SkeletonMealCard />
          <SkeletonMealCard />
          <SkeletonMealCard />
        </div>
      </div>
    </div>
  );
}
