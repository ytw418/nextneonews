import type { ChartId, EventView } from "@kmedia/core";

import { CHART_TINT, displayName, getEntities, getLatestSnapshot, latestArticles, nextEventFor } from "./rankings";

// 홈 '내 최애' 후보: K-pop 차트 위쪽 + 배우 차트 위쪽. 최애를 고를 때 보이는 얼굴이자,
// 이미 고른 사람이 오늘 차트에 있으면 최신 글·다음 일정을 붙이는 데 쓴다 (서버 HTML 에 들어가 화면 재생성 때만 DB 를 부른다)
const FROM: { chart: ChartId; take: number }[] = [
  { chart: "kpop", take: 9 },
  { chart: "actors", take: 3 },
];

export interface PickCandidate {
  id: string;
  name: string;
  slug: string | null;
  avatar: string | null;
  tint: string;
  rank: number;
  chart: ChartId;
  latest: { slug: string; title: string } | null;
  event: { id: string; name: string; view: EventView } | null;
}

export async function pickCandidates(locale: string): Promise<PickCandidate[]> {
  const snapshots = await Promise.all(FROM.map(({ chart }) => getLatestSnapshot(chart)));
  const items = FROM.flatMap(({ chart, take }, i) =>
    (snapshots[i]?.items ?? []).slice(0, take).map((item) => ({ chart, item })),
  );
  // 같은 사람이 두 차트에 있으면 앞 차트(K-pop) 하나만
  const seen = new Set<string>();
  const unique = items.filter(({ item }) => (seen.has(item.entityId) ? false : (seen.add(item.entityId), true)));
  if (unique.length === 0) return [];
  const [entities, articles] = await Promise.all([
    getEntities(unique.map(({ item }) => item.entityId)),
    latestArticles(
      locale,
      unique.map(({ item }) => item),
    ),
  ]);
  return unique.map(({ chart, item }) => {
    const entity = entities.get(item.entityId);
    const event = nextEventFor(item.names);
    return {
      id: item.entityId,
      name: displayName(item.names, locale, item.entityId),
      slug: entity?.slug ?? null,
      avatar: entity?.photo?.avatar ?? null,
      tint: CHART_TINT[chart],
      rank: item.rank,
      chart,
      latest: articles.get(item.entityId) ?? null,
      event: event ? { id: event.id, name: event.name, view: event.view } : null,
    };
  });
}
