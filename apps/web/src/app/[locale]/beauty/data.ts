import "server-only";

import type { Locale } from "@kmedia/core";
import { cache } from "react";

import { type BeautyEntry, beautyText, listBeauty } from "@/data/beauty";
import { BEAUTY_CATEGORIES, type BeautyCategory } from "@/data/beauty/types";
import { type Ranked, rankAwards, sumVotes } from "@/lib/beauty";
import { getItemTotals } from "@/lib/item-votes";

// 뷰티 화면들이 함께 쓰는 한 번의 조회: 제품 50 + 문구 + 표 집계(groupBy 1회) + 분류별 어워드 순위.
// generateMetadata 와 본문이 같은 요청에서 한 번만 읽는다 (cache). 표 테이블이 없어도 0 표로 뜬다
export const loadBeauty = cache(async (locale: Locale) => {
  const [entries, text] = await Promise.all([listBeauty(locale), beautyText(locale)]);
  const totals = await getItemTotals("beauty", entries.map((e) => e.slug));
  const ranked = new Map<BeautyCategory, Ranked<BeautyEntry>[]>();
  const votes = new Map<BeautyCategory, number>();
  for (const category of BEAUTY_CATEGORIES) {
    const list = rankAwards(entries.filter((e) => e.category === category), totals);
    ranked.set(category, list);
    votes.set(category, sumVotes(list.map((r) => r.item.slug), totals));
  }
  return { entries, text, totals, ranked, votes };
});
