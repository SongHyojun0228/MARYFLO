export default function CalendarLoading() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-7 w-24 animate-pulse rounded-lg bg-gray-200" />
        <div className="mt-2 h-4 w-48 animate-pulse rounded-lg bg-gray-100" />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 shadow-lg lg:col-span-2">
          <div className="h-6 w-32 animate-pulse rounded bg-gray-200" />
          <div className="mt-4 grid grid-cols-7 gap-1">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded bg-gray-50 sm:h-16" />
            ))}
          </div>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-lg">
          <div className="h-5 w-24 animate-pulse rounded bg-gray-200" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-100" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
