import "server-only";

import type { Locale } from "@kmedia/core";
import { unstable_cache } from "next/cache";
import { PHASE_PRODUCTION_BUILD } from "next/constants";
import { cache } from "react";

import { type BeautyEntry, beautySlugs, beautyText, listBeauty } from "@/data/beauty";
import { BEAUTY_CATEGORIES, type BeautyCategory } from "@/data/beauty/types";
import { type Ranked, rankAwards, sumVotes } from "@/lib/beauty";
import { GUIDE_INDEX_LOCALES } from "@/lib/guide-seo";
import { getItemTotals, type ItemTotals } from "@/lib/item-votes";

// 뷰티 화면은 정적이다 (revalidate=false). 봇이 와도 다시 그리지 않아 DB 를 깨우지 않는다.
// - 빌드: DB 를 읽지 않는다 → 편집 점수 순서, 표 수는 모름 (DB 가 멈춰도 빌드가 된다)
// - 다시 그리기: 파이프라인이 하루 1번 뷰티 경로를 무효화하면(revalidatePath('/[locale]/beauty', 'layout')) 그때 독자 표를 반영한다.
//   표 집계는 요청을 넘어 공유하는 캐시 하나라, 무효화 뒤 처음 그리는 화면만 DB 를 읽고 나머지 화면·언어는 그 값을 쓴다
// - 화면의 투표 칩 숫자는 브라우저가 /api/items(CDN 5분)로 따로 받는다 (components/beauty/ProductVote.tsx)

// 표 집계 캐시 태그 (revalidateTag 로도 비울 수 있다)
export const BEAUTY_TOTALS_TAG = "item-totals:beauty";

// 수명은 두지 않는다 (무효화될 때까지). unstable_cache 에 수명(초)을 주면 그 값이 화면의 다시 그리기 주기가 되어
// (Next 16 unstable-cache: workUnitStore.revalidate 를 줄인다) 봇이 아무 때나 화면을 다시 그리며 DB 를 깨운다.
// 위 layout 무효화가 화면과 이 캐시를 함께 비운다 (경로 암묵 태그 _N_T_/[locale]/beauty/layout)
const sharedTotals = unstable_cache(
  async (): Promise<[string, ItemTotals][]> => [...(await getItemTotals("beauty", beautySlugs()))],
  ["beauty-item-totals"],
  { tags: [BEAUTY_TOTALS_TAG], revalidate: false },
);

// 빌드 중이거나 조회가 던지면(한도 초과 등) null (모름) — 던진 실패는 캐시에 남지 않아 다음 다시 그리기에서 또 시도한다.
// 연결 거부처럼 getItemTotals 가 0표로 바꿔 주는 실패는 0표로 남는다 (화면도 편집 점수 순서로 굳고, 다음 무효화 때 다시 읽는다)
async function readTotals(): Promise<Map<string, ItemTotals> | null> {
  if (process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD) return null;
  try {
    return new Map(await sharedTotals());
  } catch (err) {
    console.error("[beauty] 표 집계를 읽지 못해 편집 점수 순서로 그린다", err);
    return null;
  }
}

// 빌드 때 미리 만드는 언어 (검색에 내는 언어 = lib/guide-seo). 나머지 언어는 첫 요청 때 만들어 계속 둔다
export function prerendered(locale: string): boolean {
  return (GUIDE_INDEX_LOCALES as readonly string[]).includes(locale);
}

// 상세 화면 generateStaticParams 용: 색인 언어면 전부, 그 밖 언어는 자리표시 하나(화면이 notFound 로 404 를 굽는다).
// 언어 레이아웃이 9개 언어를 하나씩 넘기는데, 빈 배열을 돌려주면 그 언어가 하위 값 없이 그대로 남아 이 경로 전체가
// 프리렌더에서 빠진다 (Next 16 build/static-paths). 자리표시는 Next 문서의 '__placeholder__' 방식이다
const RUNTIME_ONLY = "__runtime__";

export function staticParamsFor<K extends string>(locale: string, key: K, values: readonly string[]): Record<K, string>[] {
  const list = prerendered(locale) ? values : [RUNTIME_ONLY];
  return list.map((value) => ({ [key]: value }) as Record<K, string>);
}

// 뷰티 화면들이 함께 쓰는 한 번의 조회: 제품 50 + 문구 + 표 집계 + 분류별 어워드 순위.
// generateMetadata 와 본문이 같은 요청에서 한 번만 읽는다 (cache). withVotes=false 면 순위는 편집 점수만 (산식 줄도 그렇게 적는다)
export const loadBeauty = cache(async (locale: Locale) => {
  const [entries, text, read] = await Promise.all([listBeauty(locale), beautyText(locale), readTotals()]);
  const totals = read ?? new Map<string, ItemTotals>();
  const withVotes = [...totals.values()].some((t) => t.total > 0);
  const ranked = new Map<BeautyCategory, Ranked<BeautyEntry>[]>();
  const votes = new Map<BeautyCategory, number>();
  for (const category of BEAUTY_CATEGORIES) {
    const list = rankAwards(entries.filter((e) => e.category === category), totals);
    ranked.set(category, list);
    votes.set(category, sumVotes(list.map((r) => r.item.slug), totals));
  }
  return { entries, text, totals, withVotes, ranked, votes };
});
