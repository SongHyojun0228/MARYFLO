export default function LeadsLoading() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-7 w-32 animate-pulse rounded-lg bg-gray-200" />
          <div className="mt-2 h-4 w-56 animate-pulse rounded-lg bg-gray-100" />
        </div>
        <div className="h-9 w-24 animate-pulse rounded-lg bg-gray-200" />
      </div>
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="w-full shrink-0 rounded-xl bg-white p-4 shadow-lg sm:w-72"
          >
            <div className="mb-3 h-5 w-20 animate-pulse rounded bg-gray-200" />
            <div className="space-y-2">
              {Array.from({ length: 2 }).map((_, j) => (
                <div key={j} className="h-16 animate-pulse rounded-lg bg-gray-100" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
