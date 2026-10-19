"use client";

import { useLocale, useTranslations } from "next-intl";

import { useListTotals } from "@/components/guide/LiveTotals";
import { StarFilledIcon } from "@/components/icons";
import { formatAverage, starSummary } from "@/lib/drama";

// 카드 아래 별점 한 줄: 평가가 충분하면 '★ 4.6 · 12개', 적으면 '별점 3개', 없으면 '아직 별점 없음' (0 은 0).
// 집계는 감싼 LiveTotals 가 브라우저에서 받는다 — 받기 전에는 줄 높이만 비워 둔다(정적 HTML 에 '0개'를 굽지 않는다)
export function CardRating({ id }: { id: string }) {
  const t = useTranslations("Drama.rating");
  const locale = useLocale();
  const totals = useListTotals(id);
  if (!totals) return <span aria-hidden className="h-[1lh]" />;
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
