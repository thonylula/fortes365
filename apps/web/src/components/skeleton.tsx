export function Skeleton({
  width,
  height,
  className = "",
  rounded = false,
}: {
  width?: string;
  height?: string;
  className?: string;
  rounded?: boolean;
}) {
  return (
    <div
      className={`skeleton ${rounded ? "!rounded-full" : ""} ${className}`}
      style={{ width, height }}
    />
  );
}

export function SkeletonChipStrip({ count = 6 }: { count?: number }) {
  return (
    <div className="flex gap-[5px] overflow-hidden px-4 py-3">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="skeleton h-[30px] w-[60px] shrink-0 rounded-[5px]" />
      ))}
    </div>
  );
}

export function SkeletonDayStrip() {
  return (
    <div className="flex gap-[5px] overflow-hidden px-4 py-2">
      {Array.from({ length: 7 }, (_, i) => (
        <div key={i} className="skeleton h-[48px] w-[56px] shrink-0 rounded-[7px]" />
      ))}
    </div>
  );
}

export function SkeletonExCard() {
  return (
    <div className="flex gap-3 rounded-xl border border-[color:var(--bd)] bg-[color:var(--s1)] p-[0.9rem]">
      <div className="skeleton h-6 w-6 rounded" />
      <div className="flex-1 space-y-2">
        <div className="skeleton h-4 w-3/4 rounded" />
        <div className="skeleton h-3 w-1/2 rounded" />
        <div className="flex gap-2">
          <div className="skeleton h-5 w-12 rounded" />
          <div className="skeleton h-5 w-10 rounded" />
          <div className="skeleton h-5 w-14 rounded" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonKsBox() {
  return (
    <div className="rounded-lg border border-[color:var(--bd)] bg-[color:var(--s2)] p-[9px] text-center">
      <div className="skeleton mx-auto mb-1 h-5 w-10 rounded" />
      <div className="skeleton mx-auto h-3 w-8 rounded" />
    </div>
  );
}

export function SkeletonMealCard() {
  return (
    <div className="rounded-xl border border-[color:var(--bd)] bg-[color:var(--s1)] p-4">
      <div className="mb-3 flex items-center gap-2">
        <div className="skeleton h-5 w-5 rounded-full" />
        <div className="skeleton h-4 w-24 rounded" />
        <div className="skeleton ml-auto h-4 w-12 rounded" />
      </div>
      <div className="space-y-1.5">
        <div className="skeleton h-3 w-full rounded" />
        <div className="skeleton h-3 w-5/6 rounded" />
        <div className="skeleton h-3 w-2/3 rounded" />
      </div>
    </div>
  );
}

export function SkeletonRecipeCard() {
  return (
    <div className="rounded-xl border border-[color:var(--bd)] bg-[color:var(--s1)] p-4">
      <div className="skeleton mb-2 h-5 w-5 rounded" />
      <div className="skeleton mb-1 h-4 w-3/4 rounded" />
      <div className="skeleton h-3 w-1/2 rounded" />
    </div>
  );
}

export function SkeletonAchievementCard() {
  return (
    <div className="rounded-xl border border-[color:var(--bd)] bg-[color:var(--s1)] p-4 text-center">
      <div className="skeleton mx-auto mb-2 h-8 w-8 rounded-full" />
      <div className="skeleton mx-auto mb-1 h-3 w-16 rounded" />
      <div className="skeleton mx-auto h-2 w-20 rounded" />
    </div>
  );
}

export function SkeletonHeader() {
  return (
    <header className="sticky top-0 z-20 flex h-[52px] items-center justify-between border-b border-[color:var(--bd)] bg-[color:var(--s1)] px-4">
      <div className="skeleton h-6 w-24 rounded" />
      <div className="skeleton h-7 w-14 rounded-md" />
    </header>
  );
}

export function SkeletonNavTabs() {
  return (
    <div className="flex border-b border-[color:var(--bd)] bg-[color:var(--s1)]">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="flex min-w-[56px] flex-1 flex-col items-center gap-1 px-1 py-2">
          <div className="skeleton h-4 w-4 rounded" />
          <div className="skeleton h-2 w-8 rounded" />
        </div>
      ))}
    </div>
  );
}
