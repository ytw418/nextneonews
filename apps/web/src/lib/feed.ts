import { getTranslations } from "next-intl/server";

import type { FeedItem } from "@/components/FeedCard";

import type { FeedRow } from "./articles";
import { coverStyle } from "./cover";
import { timeAgo } from "./time";

// 이 파일은 FeedLoader(클라이언트)도 가져다 쓴다. next-intl/server 는 클라이언트에서 부르지만 않으면 괜찮다 (toFeedItems 는 서버에서만)

// 첫 화면(홈·카테고리)은 30개, /news/page/2 부터는 20개씩. 2쪽은 홈의 31번째 글부터 이어진다
export const FIRST_PAGE_SIZE = 30;
export const PAGE_SIZE = 20;
// 스크롤로 이어 붙이는 덩어리 수 상한. 그 뒤로는 '더 보기' 링크(쪽 번호 주소)로 간다
export const MAX_APPENDED = 5;

export function pageSkip(page: number): number {
  return page <= 1 ? 0 : FIRST_PAGE_SIZE + (page - 2) * PAGE_SIZE;
}

export function pageCount(total: number): number {
  return total <= FIRST_PAGE_SIZE ? 1 : 1 + Math.ceil((total - FIRST_PAGE_SIZE) / PAGE_SIZE);
}

// 주소의 쪽 번호. '2'·'15' 만 받고 '02'·'1.5'·'abc' 는 없는 쪽(null)
export function parsePage(value: string | null | undefined): number | null {
  return value && /^[1-9]\d{0,3}$/.test(value) ? Number(value) : null;
}

// 반응 {love,wow,more,sad} 개수의 합
function reactionTotal(reactions: unknown): number {
  if (!reactions || typeof reactions !== "object") return 0;
  return Object.values(reactions).reduce<number>((sum, n) => sum + (typeof n === "number" && n > 0 ? n : 0), 0);
}

export async function toFeedItems(rows: FeedRow[], locale: string): Promise<FeedItem[]> {
  const t = await getTranslations({ locale, namespace: "Category" });
  return rows.map((row) => ({
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    category: row.article.category,
    categoryLabel: t(row.article.category),
    timeAgo: timeAgo(row.article.publishedAt, locale),
    locale,
    imageUrl: row.article.media[0]?.url,
    credit: row.article.media[0],
    commentCount: row.article._count.comments,
    reactionTotal: reactionTotal(row.article.reactions),
  }));
}

// 카드 높이 어림 (열 폭 = 1). 사진 카드는 그림 + 제목·메타(일본어는 요약 한 줄 더), 메모 카드는 메모 한 장(+ 댓글·반응 줄)
export function estimate(item: FeedItem): number {
  const counts = (item.commentCount ?? 0) > 0 || (item.reactionTotal ?? 0) > 0;
  if (!item.imageUrl) return coverStyle(item.slug, item.category).aspect + (counts ? 0.16 : 0);
  return coverStyle(item.slug, item.category).aspect + 0.55 + (item.locale === "ja" && item.summary ? 0.14 : 0);
}

export interface Placed {
  item: FeedItem;
  order: number; // 글자가 커져 한 열이 될 때 최신순을 지키는 순서
}

// 카드를 하나씩 더 짧은 열에 넣는다 (CSS columns 는 2번째 글을 화면 아래로 밀어 내서).
// 이어 붙일 때는 앞 덩어리의 열 높이·순서에서 이어 간다
export function splitColumns(items: FeedItem[], from = { left: 0, right: 0, order: 0 }) {
  const left: Placed[] = [];
  const right: Placed[] = [];
  let { left: leftH, right: rightH } = from;
  items.forEach((item, i) => {
    const placed = { item, order: from.order + i };
    if (leftH <= rightH) {
      left.push(placed);
      leftH += estimate(item);
    } else {
      right.push(placed);
      rightH += estimate(item);
    }
  });
  return { left, right, end: { left: leftH, right: rightH, order: from.order + items.length } };
}

export type ColumnEnd = ReturnType<typeof splitColumns>["end"];

// 쪽 주소 (언어 접두사 없이, Link 가 붙인다). 1쪽은 홈·카테고리 첫 화면, 2쪽부터 /news/page/2 · /c/kpop/page/2
export function pagePath(page: number, category?: string): string {
  const base = category ? `/c/${category}` : "";
  if (page <= 1) return base || "/";
  return category ? `${base}/page/${page}` : `/news/page/${page}`;
}
