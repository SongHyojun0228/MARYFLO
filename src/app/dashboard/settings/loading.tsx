export default function SettingsLoading() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-7 w-16 animate-pulse rounded-lg bg-gray-200" />
        <div className="mt-2 h-4 w-48 animate-pulse rounded-lg bg-gray-100" />
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-2xl bg-white p-5 shadow-lg">
          <div className="h-5 w-28 animate-pulse rounded bg-gray-200" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 2 }).map((_, j) => (
              <div key={j}>
                <div className="h-3 w-16 animate-pulse rounded bg-gray-100" />
                <div className="mt-1.5 h-9 animate-pulse rounded-md bg-gray-100" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
