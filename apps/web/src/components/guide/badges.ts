import type { CatalogSummary } from "@/data/types";

// 'NEW' 배지는 다른 항목과 갈릴 때만 단다. 카탈로그를 한꺼번에 넣은 첫 2주처럼 목록이 전부 새것이면
// 모든 카드에 NEW 가 붙어 아무 뜻이 없고 라벨만 가린다
export function newBadgeShows(items: readonly Pick<CatalogSummary, "badge">[]): boolean {
  return items.some((item) => item.badge !== "new");
}
