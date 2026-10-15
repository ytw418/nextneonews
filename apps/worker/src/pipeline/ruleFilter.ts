import type { SignalMetrics } from "../collectors/types";

export interface FilterInput {
  id: string;
  title: string;
  metrics: SignalMetrics;
}

export interface FilterResult<T extends FilterInput> {
  passed: T[];
  rejected: { item: T; reason: string }[];
}

// 🔴 등급: 쓰지 않는 주제 (docs/PRD.md 4.3). AI 채점에서도 다시 거르지만, 비용을 아끼려고 먼저 자른다.
const RED_KEYWORDS = [
  "사망", "숨진", "숨져", "별세", "부고", "빈소", "자살", "극단적 선택",
  "살해", "살인", "성폭행", "성범죄", "강간", "불법촬영", "몰카", "마약", "성추행", "성희롱",
  "대통령", "국회의원", "정당", "선거", "탄핵", "여당", "야당",
];

const MIN_TITLE_LENGTH = 6;
const MIN_VIEWS = 1000;

function normalizeTitle(title: string): string {
  return title
    .replace(/\[[^\]]*\]/g, "")
    .replace(/[^\p{L}\p{N}]/gu, "")
    .slice(0, 20);
}

// 1단계 규칙 필터 (docs/production.md ①). 무료·즉시 실행.
export function ruleFilter<T extends FilterInput>(items: T[]): FilterResult<T> {
  const passed: T[] = [];
  const rejected: { item: T; reason: string }[] = [];
  const bestByTitle = new Map<string, T>();

  for (const item of items) {
    const title = item.title.trim();
    const red = RED_KEYWORDS.find((word) => title.includes(word));
    if (red) {
      rejected.push({ item, reason: `red:${red}` });
    } else if (title.length < MIN_TITLE_LENGTH) {
      rejected.push({ item, reason: "short-title" });
    } else if (item.metrics.views !== undefined && item.metrics.views < MIN_VIEWS) {
      rejected.push({ item, reason: "low-views" });
    } else {
      const key = normalizeTitle(title);
      const prev = bestByTitle.get(key);
      if (!prev) {
        bestByTitle.set(key, item);
      } else {
        // 같은 주제면 순위가 더 높은(숫자가 작은) 쪽만 남긴다
        const keepNew = (item.metrics.rank ?? Infinity) < (prev.metrics.rank ?? Infinity);
        bestByTitle.set(key, keepNew ? item : prev);
        rejected.push({ item: keepNew ? prev : item, reason: "duplicate" });
      }
    }
  }

  passed.push(...bestByTitle.values());
  return { passed, rejected };
}
