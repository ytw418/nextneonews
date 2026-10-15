// 광고 자리. 애드센스 승인 전에는 운영에서 아무것도 그리지 않고, 개발 중에만 자리 표시를 보여 준다
export function AdSlot({ label = "AD" }: { label?: string }) {
  if (process.env.NODE_ENV === "production") return null;
  return (
    <div className="mx-read my-6">
      <p className="mb-1 text-st12 text-ink-600">{label}</p>
      <div className="flex min-h-[250px] items-center justify-center rounded-card border border-dashed border-line" />
    </div>
  );
}
