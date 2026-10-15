// 광고 자리. 애드센스 승인 전에는 운영에서 아무것도 그리지 않고, 개발 중에만 자리 표시를 보여 준다
export function AdSlot({ label = "AD" }: { label?: string }) {
  if (process.env.NODE_ENV === "production") return null;
  return (
    <div className="mx-4 my-6 flex h-[250px] items-center justify-center rounded-[14px] border border-dashed border-line font-label text-[12px] tracking-[0.2em] text-muted">
      {label}
    </div>
  );
}
