// DB 의 Category enum 과 같은 값. 화면 이름은 apps/web/messages 의 Category 에 있다
export const CATEGORIES = [
  "KPOP",
  "KENT",
  "KDRAMA",
  "KFOOD",
  "TRAVEL",
  "WORKING_HOLIDAY",
  "JOBS",
  "HOUSING",
  "LIFE",
] as const;
export type CategoryKey = (typeof CATEGORIES)[number];

export function isCategory(value: string): value is CategoryKey {
  return (CATEGORIES as readonly string[]).includes(value);
}

// URL 에는 소문자 (/ja/c/kpop)
export const categorySlug = (c: CategoryKey) => c.toLowerCase().replace("_", "-");
export function categoryFromSlug(slug: string): CategoryKey | undefined {
  const key = slug.toUpperCase().replace("-", "_");
  return isCategory(key) ? key : undefined;
}
