import type { ChartKey, RankingItem } from "@kmedia/core";
import { getTranslations } from "next-intl/server";

import { ChevronRightIcon } from "@/components/icons";
import { RankChange } from "@/components/rankings/RankChange";
import { Sparkline } from "@/components/rankings/Sparkline";
import { Link } from "@/i18n/navigation";
import { formatScore, periodDateTime, periodLabel } from "@/lib/rankings";

interface Props {
  chart: ChartKey;
  chartName: string;
  locale: string;
  period: string; // 최신 매일판
  item: RankingItem | null; // 오늘 순위표에 없으면 null
  history: (number | null)[]; // 최근 90일 순위 (lib/entities getRankHistory)
}

// 순위 줄: 이 인물이 오르는 차트의 오늘 순위 · 변동 · 점수, 90일 순위 선, 차트로 가는 링크
export async function IdolRank({ chart, chartName, locale, period, item, history }: Props) {
  const t = await getTranslations("Idol");
  const tr = await getTranslations("Rankings");
  const ranked = history.filter((r): r is number => r !== null);
  const best = ranked.length > 0 ? Math.min(...ranked) : null;

  return (
    <section aria-labelledby="idol-rank" className="px-gutter pt-4">
      <div className="rounded-card bg-card p-4 shadow-card">
        <h2 id="idol-rank" className="text-t6 font-semibold text-ink-600">
          {chartName}
        </h2>
        {item ? (
          <p className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-t1 font-bold tabular-nums text-ink-900">{tr("rankLabel", { rank: item.rank })}</span>
            <RankChange rank={item.rank} prevRank={item.prevRank} />
            <span className="text-t7 text-ink-600">
              {tr("score")} <span className="font-semibold tabular-nums text-ink-700">{formatScore(item.score, locale)}</span>
            </span>
          </p>
        ) : (
          <p className="mt-1 text-t5 font-semibold text-ink-900">{t("notRanked")}</p>
        )}
        <p className="text-st12 text-ink-600">
          <time dateTime={periodDateTime(period)}>{periodLabel(period, locale)}</time>
        </p>

        {ranked.length >= 2 && (
          <figure className="mt-3">
            <figcaption className="flex flex-wrap justify-between gap-x-3 pb-1 text-st12 font-semibold text-ink-600">
              <span>{t("trend90")}</span>
              {best !== null && <span className="tabular-nums">{t("best90", { rank: tr("rankLabel", { rank: best }) })}</span>}
            </figcaption>
            {/* 순위는 작을수록 위라 뒤집어 그린다 */}
            <Sparkline values={history.map((r) => (r === null ? null : -r))} label={t("trend90")} />
          </figure>
        )}

        <Link
          href={item ? `/rankings/${chart}#r-${item.entityId}` : `/rankings/${chart}`}
          className="press -mb-2 mt-1 inline-flex min-h-11 items-center gap-0.5 text-t6 font-semibold text-ink-700"
        >
          {tr("fullChart")}
          <ChevronRightIcon className="size-4 text-ink-400" />
        </Link>
      </div>
    </section>
  );
}
