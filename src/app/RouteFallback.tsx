/** Skeleton shown while a tool's chunk is loading. */
export function RouteFallback() {
  return (
    <div className="flex h-full flex-col gap-4 p-4 md:p-6" aria-busy="true" aria-label="Loading tool">
      <div className="flex items-center gap-3">
        <div className="skeleton h-9 w-9 rounded-lg" />
        <div className="space-y-1.5">
          <div className="skeleton h-3.5 w-40 rounded" />
          <div className="skeleton h-3 w-64 rounded" />
        </div>
      </div>
      <div className="grid flex-1 gap-4 lg:grid-cols-2">
        <div className="skeleton rounded-lg opacity-60" />
        <div className="skeleton hidden rounded-lg opacity-60 lg:block" />
      </div>
    </div>
  );
}
