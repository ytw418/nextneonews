"use client";

export default function LoadingSpinner() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white/50">
      <div className="w-8 h-8 border-4 border-gray-200 rounded-full animate-spin border-t-blue-600"></div>
    </div>
  );
}
