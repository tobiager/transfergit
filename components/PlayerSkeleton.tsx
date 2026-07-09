export function PlayerSkeleton() {
  return (
    <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 px-4 py-8 md:grid-cols-3 md:px-6">
      <div className="space-y-6 md:col-span-2">
        <div className="h-48 rounded-xl border border-border bg-surface p-6">
          <div className="flex gap-6">
            <div className="shimmer h-28 w-28 rounded-lg md:h-36 md:w-36" />
            <div className="flex-1 space-y-3">
              <div className="shimmer h-4 w-32 rounded" />
              <div className="shimmer h-8 w-56 rounded" />
              <div className="shimmer h-4 w-24 rounded" />
            </div>
          </div>
        </div>
        <div className="shimmer h-80 rounded-xl border border-border" />
        <div className="shimmer h-64 rounded-xl border border-border" />
      </div>
      <div className="space-y-6">
        <div className="shimmer h-64 rounded-xl border border-border" />
        <div className="shimmer h-48 rounded-xl border border-border" />
        <div className="shimmer h-48 rounded-xl border border-border" />
      </div>
    </div>
  );
}
