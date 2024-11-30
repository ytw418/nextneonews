export default function Loading() {
  return (
    <div className="max-w-screen-md mx-auto px-4 py-6">
      <div className="h-8 w-32 bg-gray-200 rounded mb-6 animate-pulse" />
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="p-4 bg-white rounded-lg border border-gray-100"
          >
            <div className="flex justify-between items-start">
              <div className="space-y-2 flex-1">
                <div className="h-6 bg-gray-200 rounded w-3/4 animate-pulse" />
                <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
              </div>
              <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
