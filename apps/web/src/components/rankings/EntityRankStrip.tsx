import { CHARTS, type ChartKey } from "@kmedia/core";
import { getTranslations } from "next-intl/server";

import { ChevronRightIcon } from "@/components/icons";
import { TrophyIcon } from "@/components/rankings/icons";
import { RankChange } from "@/components/rankings/RankChange";
import { Link } from "@/i18n/navigation";
import { CHART_KEY, displayName, getLatestSnapshot } from "@/lib/rankings";

const CHART_KEYS = Object.keys(CHARTS) as ChartKey[];
const MAX_CHIPS = 3;

// 글 안에 넣는 순위 칩: 'BTS #3 K-pop Buzz ▲2 →'. 글에 나온 인물이 오늘 차트에 있을 때만 (없으면 아무것도 그리지 않는다).
// Entity.id 는 글 페이지가 lib/entities 의 matchArticleEntities 로 찾아 넘긴다 (옛 글 entities 에는 이름만 있다)
export async function EntityRankStrip({
  entityIds,
  locale,
  className = "",
}: {
  entityIds: string[];
  locale: string;
  className?: string;
}) {
  if (entityIds.length === 0) return null;
  const snapshots = await Promise.all(CHART_KEYS.map((chart) => getLatestSnapshot(chart)));
  const chips = entityIds
    .flatMap((id) =>
      CHART_KEYS.flatMap((chart, i) => {
        const item = snapshots[i]?.items.find((it) => it.entityId === id);
        return item ? [{ chart, item }] : [];
      }),
    )
    .sort((a, b) => a.item.rank - b.item.rank)
    .slice(0, MAX_CHIPS);
  if (chips.length === 0) return null;
  const t = await getTranslations("Rankings");

  return (
    <ul aria-label={t("tab")} className={`flex flex-wrap gap-2 ${className}`}>
      {chips.map(({ chart, item }) => (
        <li key={`${chart}-${item.entityId}`}>
          <Link
            href={`/rankings/${chart}#r-${item.entityId}`}
            // 바탕은 카드색: brand-weak 위에 NEW 칩(brand-weak)이 겹치면 색이 진해져 글자 대비가 4.5 아래로 떨어졌다
            className="press inline-flex min-h-9 items-center gap-1.5 rounded-full bg-card px-3 text-t7 font-semibold text-brand-ink ring-1 ring-line"
          >
            <TrophyIcon className="size-4 shrink-0" />
            <span>{displayName(item.names, locale, item.entityId)}</span>
            <span className="tabular-nums">#{item.rank}</span>
            <span>{t(`chart.${CHART_KEY[chart]}.short`)}</span>
            <RankChange rank={item.rank} prevRank={item.prevRank} />
            <ChevronRightIcon className="size-3.5 shrink-0" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
