export default function ReportsLoading() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-7 w-24 animate-pulse rounded-lg bg-gray-200" />
        <div className="mt-2 h-4 w-48 animate-pulse rounded-lg bg-gray-100" />
      </div>
      <div>
        <div className="mb-3 h-4 w-20 animate-pulse rounded bg-gray-100" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-white p-4 shadow-lg">
              <div className="h-4 w-16 animate-pulse rounded bg-gray-100" />
              <div className="mt-2 h-7 w-10 animate-pulse rounded bg-gray-200" />
            </div>
          ))}
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-2xl bg-white p-5 shadow-lg">
            <div className="h-5 w-28 animate-pulse rounded bg-gray-200" />
            <div className="mt-4 space-y-3">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="h-4 animate-pulse rounded bg-gray-100" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
