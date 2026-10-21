// 저장 목록 규칙 — 웹 apps/web/src/lib/saved.ts·data/sections.ts 와 같다 (상한 300, 최신순, 같은 항목은 최신 하나, 모르는 종류·모양은 버림).
// 웹 규칙을 바꾸면 여기도 고친다. 순수 함수 (루트 vitest 가 돈다)

export type SavedKind = "article" | "beauty" | "place" | "clinic" | "drama";
export const SAVED_KINDS: readonly SavedKind[] = ["article", "beauty", "place", "clinic", "drama"];

export interface SavedItem {
  kind: SavedKind;
  id: string;
  at: number;
}

export const SAVED_MAX = 300;
const CATALOG_SLUG = /^[a-z0-9-]{2,64}$/;
const ARTICLE_SLUG = /^[a-z0-9][a-z0-9-]{1,159}$/;

const keyOf = (item: Pick<SavedItem, "kind" | "id">) => `${item.kind}:${item.id}`;

export function isSavedItem(value: unknown): value is SavedItem {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  if (typeof v.kind !== "string" || !(SAVED_KINDS as readonly string[]).includes(v.kind)) return false;
  const slug = v.kind === "article" ? ARTICLE_SLUG : CATALOG_SLUG;
  return typeof v.id === "string" && slug.test(v.id) && typeof v.at === "number" && Number.isFinite(v.at);
}

// 모르는 값은 버리고 최신순·중복 제거·상한
export function normalizeSaved(items: readonly unknown[]): SavedItem[] {
  const seen = new Set<string>();
  return items
    .filter(isSavedItem)
    .sort((a, b) => b.at - a.at)
    .filter((item) => {
      const key = keyOf(item);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, SAVED_MAX);
}

export function parseSaved(raw: string | null): SavedItem[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? normalizeSaved(parsed) : [];
  } catch {
    return [];
  }
}

export function withoutItem(items: readonly SavedItem[], item: Pick<SavedItem, "kind" | "id">): SavedItem[] {
  const key = keyOf(item);
  return items.filter((i) => keyOf(i) !== key);
}

export const savedKey = keyOf;
