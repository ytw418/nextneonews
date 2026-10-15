// DB 의 Category enum 과 같은 값. 화면 이름은 apps/web/messages 의 Category 에 있다
export const CATEGORIES = [
  "KPOP",
  "KENT",
  "KDRAMA",
  "KFOOD",
  "KBEAUTY",
  "TRAVEL",
  "STUDY",
  "LOVE",
  "WORKING_HOLIDAY",
  "JOBS",
  "HOUSING",
  "LIFE",
] as const;
export type CategoryKey = (typeof CATEGORIES)[number];

// 메뉴에서 묶어 보여 주는 단위. 이름은 messages 의 CategoryGroup
export const CATEGORY_GROUPS = {
  ENTERTAINMENT: ["KPOP", "KENT", "KDRAMA"],
  LIFESTYLE: ["KFOOD", "KBEAUTY", "TRAVEL"],
  LIVING: ["STUDY", "LOVE", "WORKING_HOLIDAY", "JOBS", "HOUSING", "LIFE"],
} as const satisfies Record<string, readonly CategoryKey[]>;

export function isCategory(value: string): value is CategoryKey {
  return (CATEGORIES as readonly string[]).includes(value);
}

// URL 에는 소문자 (/ja/c/kpop)
export const categorySlug = (c: CategoryKey) => c.toLowerCase().replace("_", "-");
export function categoryFromSlug(slug: string): CategoryKey | undefined {
  const key = slug.toUpperCase().replace("-", "_");
  return isCategory(key) ? key : undefined;
}
