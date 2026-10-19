import "server-only";

import type { Locale, RankingItem } from "@kmedia/core";

import { coverGlyph } from "@/components/guide/glyph";
import type { DramaEntry } from "@/data/drama";
import { mixTrending } from "@/lib/drama";
import { displayName, getEntities, getLatestSnapshot } from "@/lib/rankings";

// 드라마 화면이 DB 에서 읽는 것은 허브의 '지금 화제'(K-드라마 랭킹 최신판) 하나뿐이다. 허브는 revalidate=false 라
// 빌드와 일부러 다시 만들 때(/api/revalidate)만 읽는다. 출연 인물은 빌드에 실은 사본(data/drama/people)을 쓴다.
// DB 에 닿지 않아도(미리보기 배포·빌드) 화면은 카탈로그만으로 뜬다 — 여기서 오류를 삼킨다

export const TRENDING_SIZE = 5;
// 랭킹에서 섞을 후보 수 (카탈로그에 없고 인물 페이지도 없는 작품은 빠지므로 넉넉히)
const RANKED_POOL = 10;

export interface TrendCard {
  key: string; // 카탈로그 slug, 카탈로그 밖이면 'entity:Q-id' (섞을 때 같은 작품을 한 번만)
  href: string;
  title: string;
  glyph: string;
  rank?: number; // 랭킹에서 왔으면 오늘 순위
  year?: number;
  network?: string;
  saveId?: string; // 카탈로그 작품만 저장할 수 있다
}

function catalogCard(entry: DramaEntry, rank?: number): TrendCard {
  return {
    key: entry.slug,
    href: `/drama/${entry.slug}`,
    title: entry.text.title,
    glyph: coverGlyph({ kind: "drama", episodes: entry.episodes }),
    rank,
    year: entry.year,
    network: entry.network,
    saveId: entry.slug,
  };
}

// 빌드는 9개 언어 허브를 잇달아 만든다. 랭킹 최신판은 언어와 상관없으니 한 번 읽어(빌드 작업자마다 한 번, 실패도 한 번) 나눠 쓴다.
// 묵은 값을 오래 쥐지 않게 이 시간이 지나면 다시 읽는다 — 운영에서 /api/revalidate 로 다시 만들 때는 새 랭킹을 읽는다
const RANKED_MEMO_MS = 10 * 60_000;

interface RankedRaw {
  top: RankingItem[];
  slugs: Map<string, string>; // 위키데이터 Q-id → 인물·작품 페이지 slug
}

let rankedMemo: { at: number; raw: Promise<RankedRaw> } | null = null;

async function readRanked(): Promise<RankedRaw> {
  try {
    const snapshot = await getLatestSnapshot("kdrama");
    const top = snapshot?.items.slice(0, RANKED_POOL) ?? [];
    const entities = await getEntities(top.map((i) => i.entityId));
    const slugs = new Map<string, string>();
    for (const [id, entity] of entities) if (entity.slug) slugs.set(id, entity.slug);
    return { top, slugs };
  } catch {
    return { top: [], slugs: new Map() };
  }
}

function rankedRaw(): Promise<RankedRaw> {
  const now = Date.now();
  if (!rankedMemo || now - rankedMemo.at > RANKED_MEMO_MS) rankedMemo = { at: now, raw: readRanked() };
  return rankedMemo.raw;
}

// 랭킹 상위 → 카드. 카탈로그에 있으면 가이드로, 없으면 인물·작품 페이지(/idol/slug)로. 둘 다 없으면 뺀다
async function rankedCards(locale: Locale, catalog: DramaEntry[]): Promise<TrendCard[]> {
  const { top, slugs } = await rankedRaw();
  const byWikidata = new Map(catalog.flatMap((d) => (d.wikidataId ? [[d.wikidataId, d] as const] : [])));
  return top.flatMap((item): TrendCard[] => {
    const entry = byWikidata.get(item.entityId);
    if (entry) return [catalogCard(entry, item.rank)];
    const slug = slugs.get(item.entityId);
    if (!slug) return [];
    const title = displayName(item.names, locale, item.entityId);
    return [{ key: `entity:${item.entityId}`, href: `/idol/${slug}`, title, glyph: coverGlyph({ kind: "name", name: title, locale }), rank: item.rank }];
  });
}

// '지금 화제' 5개: 랭킹 상위와 편집 점수 상위를 번갈아. 랭킹이 비면 카탈로그만
export async function trendingCards(locale: Locale, catalog: DramaEntry[]): Promise<TrendCard[]> {
  const curated = catalog
    .toSorted((a, b) => b.editorialScore - a.editorialScore || b.addedAt.localeCompare(a.addedAt))
    .map((entry) => catalogCard(entry));
  return mixTrending(await rankedCards(locale, catalog), curated, TRENDING_SIZE);
}
