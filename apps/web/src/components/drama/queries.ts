import "server-only";

import type { Locale } from "@kmedia/core";
import { prisma } from "@kmedia/db";
import { cache } from "react";

import type { DramaEntry } from "@/data/drama";
import { namesOf } from "@/lib/entities";
import { coverGlyph, mixTrending } from "@/lib/drama";
import { displayName, getEntities, getLatestSnapshot } from "@/lib/rankings";

// 드라마 화면이 DB 에서 읽는 것: K-드라마 랭킹 최신판(지금 화제)과 출연 인물(/idol 링크·현지 이름).
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
    glyph: String(entry.episodes),
    rank,
    year: entry.year,
    network: entry.network,
    saveId: entry.slug,
  };
}

// 랭킹 상위 → 카드. 카탈로그에 있으면 가이드로, 없으면 인물·작품 페이지(/idol/slug)로. 둘 다 없으면 뺀다
async function rankedCards(locale: Locale, catalog: DramaEntry[]): Promise<TrendCard[]> {
  try {
    const snapshot = await getLatestSnapshot("kdrama");
    const top = snapshot?.items.slice(0, RANKED_POOL) ?? [];
    if (top.length === 0) return [];
    const byWikidata = new Map(catalog.flatMap((d) => (d.wikidataId ? [[d.wikidataId, d] as const] : [])));
    const entities = await getEntities(top.filter((i) => !byWikidata.has(i.entityId)).map((i) => i.entityId));
    return top.flatMap((item): TrendCard[] => {
      const entry = byWikidata.get(item.entityId);
      if (entry) return [catalogCard(entry, item.rank)];
      const slug = entities.get(item.entityId)?.slug;
      if (!slug) return [];
      const title = displayName(item.names, locale, item.entityId);
      return [{ key: `entity:${item.entityId}`, href: `/idol/${slug}`, title, glyph: coverGlyph(title, locale), rank: item.rank }];
    });
  } catch {
    return [];
  }
}

// '지금 화제' 5개: 랭킹 상위와 편집 점수 상위를 번갈아. 랭킹이 비면 카탈로그만
export async function trendingCards(locale: Locale, catalog: DramaEntry[]): Promise<TrendCard[]> {
  const curated = catalog
    .toSorted((a, b) => b.editorialScore - a.editorialScore || b.addedAt.localeCompare(a.addedAt))
    .map((entry) => catalogCard(entry));
  return mixTrending(await rankedCards(locale, catalog), curated, TRENDING_SIZE);
}

export interface CastPerson {
  name: string;
  slug: string | null; // 인물 페이지가 있을 때만
}

// 출연 위키데이터 Q-id → 화면 언어 이름 + 인물 페이지 slug (lib/entities 의 이름 규칙 그대로)
export const castPeople = cache(async (ids: string, locale: Locale): Promise<Map<string, CastPerson>> => {
  const list = ids ? ids.split(",") : [];
  if (list.length === 0) return new Map();
  try {
    const rows = await prisma.entity.findMany({
      where: { id: { in: list } },
      select: { id: true, slug: true, en: true, ko: true, ja: true, zhHant: true },
    });
    return new Map(rows.map((r) => [r.id, { name: displayName(namesOf(r), locale), slug: r.slug }]));
  } catch {
    return new Map();
  }
});
