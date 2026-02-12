export default function MessagesLoading() {
  return (
    <div className="space-y-4">
      <div>
        <div className="h-7 w-32 animate-pulse rounded-lg bg-gray-200" />
        <div className="mt-2 h-4 w-56 animate-pulse rounded-lg bg-gray-100" />
      </div>
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-8 w-16 animate-pulse rounded-full bg-gray-100" />
        ))}
      </div>
      <div className="rounded-2xl bg-white shadow-lg">
        <div className="divide-y divide-gray-50">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="px-4 py-3">
              <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
              <div className="mt-2 h-3 w-full animate-pulse rounded bg-gray-100" />
              <div className="mt-1 h-3 w-16 animate-pulse rounded bg-gray-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
