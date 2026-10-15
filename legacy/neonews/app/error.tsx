"use client";

export default function Error() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-4xl font-bold">500</h1>
      <p className="mt-2">서버 오류가 발생했습니다.</p>
    </div>
  );
}
