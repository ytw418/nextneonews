import type { ChartId } from "@kmedia/core";

import { ChevronRightIcon } from "@/components/icons";
import { EntityAvatar } from "@/components/rankings/EntityAvatar";
import { RankChange } from "@/components/rankings/RankChange";
import { Link } from "@/i18n/navigation";
import { CHART_TINT, displayName, periodLabel, type RankEntity, type Snapshot } from "@/lib/rankings";

interface Props {
  chart: ChartId;
  title: string;
  snapshot: Snapshot;
  entities: Map<string, RankEntity>;
  locale: string;
  as?: "h2" | "h3";
}

// 차트 한 장 요약: 1~3위 사진·이름. 카드를 누르면 그 차트로 (허브, 차트 화면의 '이번 주 팬 투표')
export function RankingMiniCard({ chart, title, snapshot, entities, locale, as: Heading = "h2" }: Props) {
  const top = snapshot.items.slice(0, 3);
  return (
    <Link href={`/rankings/${chart}`} className="press-soft flex h-full flex-col rounded-card bg-card p-4 shadow-card">
      <span className="flex items-center justify-between gap-2">
        <Heading className="text-t5 leading-row font-bold text-ink-900">{title}</Heading>
        <ChevronRightIcon className="size-4 shrink-0 text-ink-400" />
      </span>
      <span className="text-st12 text-ink-600">{periodLabel(snapshot.period, locale)}</span>
      <ol className="mt-3 flex flex-col gap-2">
        {top.map((item) => {
          const name = displayName(item.names, locale, item.entityId);
          return (
            <li key={item.entityId} className="flex items-center gap-3">
              <span className="w-5 shrink-0 text-center text-t5 font-bold tabular-nums text-ink-900">{item.rank}</span>
              <EntityAvatar name={name} src={entities.get(item.entityId)?.photo?.avatar} tint={CHART_TINT[chart]} size={40} />
              <span className="min-w-0 flex-1 truncate text-t6 font-semibold text-ink-900">{name}</span>
              {chart !== "fan-pick" && <RankChange rank={item.rank} prevRank={item.prevRank} />}
            </li>
          );
        })}
      </ol>
    </Link>
  );
}
