export default function Loading() {
  return (
    <div className="p-4">
      <div className="h-[300px] w-full bg-gray-200 dark:bg-gray-800 rounded-lg mb-8 animate-pulse" />
      {["인기 뉴스", "K-POP 뉴스", "주요 뉴스", "AI 뉴스"].map((section) => (
        <section key={section} className="mb-8">
          <div className="h-8 w-32 bg-gray-200 dark:bg-gray-800 rounded mb-4 animate-pulse" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="flex flex-col">
                <div className="relative aspect-[16/9] bg-gray-200 dark:bg-gray-800 rounded-lg mb-2 animate-pulse" />
                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4 mb-2 animate-pulse" />
                <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-full animate-pulse" />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
