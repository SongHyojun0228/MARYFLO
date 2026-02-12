export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Title skeleton */}
      <div>
        <div className="h-7 w-40 animate-pulse rounded-lg bg-gray-200" />
        <div className="mt-2 h-4 w-64 animate-pulse rounded-lg bg-gray-100" />
      </div>

      {/* KPI cards skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl bg-white p-5 shadow-lg"
          >
            <div className="h-4 w-20 animate-pulse rounded bg-gray-100" />
            <div className="mt-3 h-8 w-12 animate-pulse rounded bg-gray-200" />
          </div>
        ))}
      </div>

      {/* Content skeleton */}
      <div className="rounded-2xl bg-white p-6 shadow-lg">
        <div className="h-5 w-32 animate-pulse rounded bg-gray-200" />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-4 animate-pulse rounded bg-gray-100" />
          ))}
        </div>
      </div>
    </div>
  );
}
