"use client";

export default function LoadingSpinner() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="relative w-16 h-16">
        {/* 그라데이션 스피너 */}
        <div
          className="absolute inset-0 rounded-full animate-spin-fast"
          style={{
            background: "conic-gradient(transparent, var(--primary))",
            clipPath: "circle(50% at center)",
          }}
        />
        {/* 중앙 원 */}
        <div className="absolute inset-[3px] bg-background rounded-full" />
      </div>
    </div>
  );
}
