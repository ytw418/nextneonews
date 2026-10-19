"use client";

import { useLocale, useTranslations } from "next-intl";

import { CelebrateOnce } from "@/components/schedule/CelebrateOnce";
import { useVisited } from "@/lib/saved";
import { keepAll, stampProgress } from "@/lib/travel";

// 동네 화면 '2/4 가 봤어요' 진행 카드. 숫자가 주인공(text-display), 막대는 체리 한 색.
// 다 모으면 D-0 폭죽을 이번 방문에 한 번 (움직임 줄이기 설정이면 CelebrateOnce 가 건너뛴다)
export function AreaProgress({ area, areaName, slugs }: { area: string; areaName: string; slugs: string[] }) {
  const t = useTranslations("Travel.area");
  const locale = useLocale();
  const { done, total, percent, complete } = stampProgress(useVisited(), slugs);
  const number = <span className="text-display font-bold tabular-nums text-ink-900">{done}</span>;

  return (
    <div className="mx-gutter rounded-card bg-card p-4 shadow-card">
      <p aria-hidden className="flex items-baseline gap-1">
        {complete ? <CelebrateOnce id={`travel-area-${area}`}>{number}</CelebrateOnce> : number}
        <span className="text-t5 tabular-nums text-ink-600">{t("progressRest", { total })}</span>
      </p>
      <div
        role="progressbar"
        aria-label={t("progressTitle", { area: areaName })}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={done}
        aria-valuetext={t("progressLabel", { done, total })}
        className="mt-3 h-1.5 overflow-hidden rounded-full bg-fill-weak"
      >
        <div
          className="h-full rounded-full bg-brand transition-[width] duration-500 ease-expo"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p aria-live="polite" className={`mt-3 text-t7 text-ink-600 ${keepAll(locale)}`}>
        {complete ? t("progressDone", { area: areaName }) : t("progressHint")}
      </p>
    </div>
  );
}
