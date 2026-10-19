import type { PriceTier } from "@/data/beauty/types";
import { priceSigns } from "@/lib/beauty";

// ₩·₩₩·₩₩₩ 가격대. 화면 읽기는 '₩ ₩' 대신 범위 문장('₩10,000–30,000')을 읽는다
export function Price({ tier, label, className = "" }: { tier: PriceTier; label: string; className?: string }) {
  return (
    <span className={`tabular-nums ${className}`}>
      <span aria-hidden>{priceSigns(tier)}</span>
      <span className="sr-only">{label}</span>
    </span>
  );
}
