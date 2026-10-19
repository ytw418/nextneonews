import { getTranslations } from "next-intl/server";

import { StarFilledIcon } from "@/components/icons";
import { formatAverage, starSummary } from "@/lib/drama";
import type { ItemTotals } from "@/lib/item-votes";

// 카드 아래 별점 한 줄 (서버 집계): 평가가 충분하면 '★ 4.6 · 12개', 적으면 '별점 3개', 없으면 '아직 별점 없음' (0 은 0)
export async function CardRating({ totals, locale }: { totals: ItemTotals; locale: string }) {
  const t = await getTranslations({ locale, namespace: "Drama.rating" });
  const { average, count, showAverage } = starSummary(totals);
  if (!showAverage) return <>{t("count", { count })}</>;
  const value = formatAverage(average, locale);
  return (
    <>
      <StarFilledIcon className="size-3.5 shrink-0 text-brand" />
      <span aria-hidden className="font-bold text-ink-900">
        {value}
      </span>
      <span className="sr-only">{t("average", { average: value })}</span>
      <span>· {t("count", { count })}</span>
    </>
  );
}
