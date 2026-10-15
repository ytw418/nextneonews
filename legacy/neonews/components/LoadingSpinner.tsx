"use client";

export default function LoadingSpinner() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-500/20 backdrop-blur-sm">
      <div
        className="w-8 h-8 border-2 border-gray-300 rounded-full"
        style={{
          borderRightColor: "#6b7280",
          animation: "spin 1s linear infinite",
        }}
      />
    </div>
  );
}
