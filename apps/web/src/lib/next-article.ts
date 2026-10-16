// 글 끝 '다음 글' 후보 순서. DB 조회는 lib/engagement.ts 가 하고, 여기는 순서만 정한다 (DB 없이 테스트하려고)

// 한 번에 넘기는 후보 수. 화면에는 최대 3편까지만 이어 붙인다 (NextArticleLoader)
export const NEXT_MAX = 6;

// 연예 글이면 일정(컴백·콘서트 등)이 걸려 있을 때 여행·뷰티 가이드 하나를 끼운다 (PRD 4.2 '돈 되는 다음 글')
const ENTERTAINMENT = new Set(["KPOP", "KENT", "KDRAMA"]);

export function wantsGuide(category: string, hasEvent: boolean): boolean {
  return hasEvent && ENTERTAINMENT.has(category);
}

export interface NextPools<T extends { slug: string }> {
  sameEntity: T[]; // 같은 인물·그룹·작품의 최신 글
  guide: T[]; // 같은 언어의 TRAVEL·KBEAUTY 가이드(GUIDE·QNA). wantsGuide 일 때만 쓴다
  sameCategory: T[];
  popular: T[]; // 이번 주 인기
}

// 같은 인물 → (연예 + 일정이면) 가이드 1개 → 같은 카테고리 → 이번 주 인기. 지금 글과 겹치는 글은 뺀다
export function pickNext<T extends { slug: string }>(
  current: { slug: string; category: string; hasEvent: boolean },
  pools: NextPools<T>,
  max = NEXT_MAX,
): T[] {
  const seen = new Set([current.slug]);
  const out: T[] = [];
  const take = (rows: T[], limit = max) => {
    let added = 0;
    for (const row of rows) {
      if (out.length >= max || added >= limit) return;
      if (seen.has(row.slug)) continue;
      seen.add(row.slug);
      out.push(row);
      added += 1;
    }
  };
  take(pools.sameEntity);
  if (wantsGuide(current.category, current.hasEvent)) take(pools.guide, 1);
  take(pools.sameCategory);
  take(pools.popular);
  return out;
}
