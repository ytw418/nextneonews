import { getTranslations } from "next-intl/server";

import type { PriceTier } from "@/data/beauty/types";
import { PRICE_TIER_KRW } from "@/lib/beauty";

// 가격대를 보이는 글자로: ₩10,000–30,000 · 1万〜3万ウォン · 1萬～3萬韓元 (경계는 lib/beauty 상수, 숫자는 언어별 형식).
// ₩₩ 기호만 두면 취소선 친 'WW' 처럼 읽혔다. 화면 읽기도 같은 글자를 읽는다
export async function Price({ tier, locale, className = "" }: { tier: PriceTier; locale: string; className?: string }) {
  const t = await getTranslations({ locale, namespace: "Beauty" });
  return <span className={`whitespace-nowrap tabular-nums ${className}`}>{t(`priceTier.${tier}`, PRICE_TIER_KRW)}</span>;
}
