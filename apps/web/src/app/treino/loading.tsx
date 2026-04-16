import {
  SkeletonHeader,
  SkeletonNavTabs,
  SkeletonChipStrip,
  SkeletonDayStrip,
  SkeletonExCard,
  SkeletonKsBox,
} from "@/components/skeleton";

export default function TreinoLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-[color:var(--bg)]">
      <SkeletonHeader />
      <SkeletonNavTabs />
      <SkeletonChipStrip count={6} />
      <SkeletonChipStrip count={4} />
      <SkeletonDayStrip />
      <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-4">
        <div className="skeleton mb-4 h-[160px] w-full rounded-xl" />
        <div className="mb-4 grid grid-cols-4 gap-2">
          <SkeletonKsBox />
          <SkeletonKsBox />
          <SkeletonKsBox />
          <SkeletonKsBox />
        </div>
        <div className="space-y-2">
          <SkeletonExCard />
          <SkeletonExCard />
          <SkeletonExCard />
        </div>
      </div>
    </div>
  );
}
