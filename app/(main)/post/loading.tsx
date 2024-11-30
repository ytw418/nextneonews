export default function PostLoading() {
  return (
    <div className="max-w-screen-md mx-auto px-4 py-6">
      {/* 제목 스켈레톤 */}
      <div className="h-8 w-3/4 bg-gray-200 rounded mb-4 animate-pulse" />

      {/* 날짜와 태그 영역 스켈레톤 */}
      <div className="flex gap-4 mb-6">
        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
      </div>

      {/* 본문 내용 스켈레톤 */}
      <div className="space-y-4">
        <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
        <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
        <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse" />
        <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
        <div className="h-4 bg-gray-200 rounded w-4/5 animate-pulse" />
      </div>
    </div>
  );
}
