"use client";

import { useLocale, useTranslations } from "next-intl";
import { useId } from "react";

import { NO_TOTALS, useLiveTotals } from "@/components/guide/LiveTotals";
import { StarFilledIcon, StarIcon } from "@/components/icons";
import { type ItemTotals, useItemVote } from "@/components/ItemVote";
import { formatAverage, starSummary } from "@/lib/drama";

const STARS = [1, 2, 3, 4, 5] as const;

// 드라마 별점 (DESIGN ⑥): 평균이 화면에서 가장 큰 숫자, 그 아래 별 다섯 개(44px 누름 영역, 체리 한 색).
// 투표·저장·한 기기 한 표는 공용 useItemVote (components/ItemVote.tsx) 그대로 — 여기서는 모양만 다르다.
// 평가가 MIN_RATINGS_FOR_AVERAGE 보다 적으면 평균 대신 '별점 n개' (한두 표의 5.0 이 과장돼 보여서).
// 페이지는 DB 를 읽지 않는 정적 HTML 이라 집계는 마운트 뒤 받는다. 받으면 새 집계로 다시 그린다(key) — 별은 그 전에도 누를 수 있다
export function DramaRating({ itemId }: { itemId: string }) {
  const live = useLiveTotals("drama", [itemId]);
  return <Rating key={live ? "live" : "static"} itemId={itemId} initial={live?.get(itemId) ?? NO_TOTALS} loading={!live} />;
}

function Rating({ itemId, initial, loading }: { itemId: string; initial: ItemTotals; loading: boolean }) {
  const t = useTranslations("Drama.rating");
  const tEngage = useTranslations("Engage");
  const locale = useLocale();
  const { mine, totals, busy, error, vote } = useItemVote("drama", itemId, initial);
  const headingId = useId();
  const picked = Number(mine) || 0;
  const { average, count, showAverage } = starSummary(totals);
  const value = formatAverage(average, locale);
  // 집계를 받기 전에는 표 수를 말하지 않는다 (정적 HTML 에 '아직 별점 없음'을 굽지 않고, 내 별점과 어긋나 보이지 않게)
  const status = [
    ...(loading ? [] : [count === 0 && picked === 0 ? t("first") : t("count", { count })]),
    ...(picked > 0 && !busy && !error ? [t("mine", { count: picked }), tEngage("voteThanks")] : []),
  ].join(" · ");

  return (
    <section aria-labelledby={headingId} className="mx-gutter mt-5 rounded-card bg-card p-4 shadow-card">
      <h2 id={headingId} className="text-t6 font-bold text-ink-900">
        {t("title")}
      </h2>
      {showAverage && (
        <p className="mt-1 flex items-baseline gap-1.5">
          <span aria-hidden className="text-display font-bold tracking-tighter tabular-nums text-ink-900">
            {value}
          </span>
          <span aria-hidden className="text-t5 font-semibold text-ink-600">
            {t("outOf")}
          </span>
          <span className="sr-only">{t("average", { average: value })}</span>
        </p>
      )}
      <div role="group" aria-labelledby={headingId} aria-busy={busy || undefined} className="-ml-1.5 mt-1 flex">
        {STARS.map((star) => (
          <button
            key={star}
            type="button"
            aria-label={tEngage("starLabel", { count: star })}
            aria-pressed={picked === star}
            onClick={() => void vote(String(star))}
            className={`press grid size-11 place-items-center rounded-full ${star <= picked ? "text-brand" : "text-ink-400"}`}
          >
            {star <= picked ? <StarFilledIcon className="size-7" /> : <StarIcon className="size-7" />}
          </button>
        ))}
      </div>
      <p className="mt-1 min-h-[1lh] text-t7 tabular-nums text-ink-600" aria-live="polite">
        {status}
      </p>
      {error && (
        <p role="alert" className="mt-2 text-t6 font-medium text-danger">
          {error}
        </p>
      )}
    </section>
  );
}
