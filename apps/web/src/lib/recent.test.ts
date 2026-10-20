import { describe, expect, it } from "vitest";

import { RECENT_MAX, type RecentItem, withRecent } from "./recent";

const read = (slug: string, locale = "ja") => ({ slug, locale, title: slug, category: "KPOP" });

describe("최근 본 글", () => {
  it("다시 읽은 글은 맨 앞으로 옮기고(다른 언어는 따로), 상한을 넘으면 가장 오래된 것부터 뺀다", () => {
    const full: RecentItem[] = Array.from({ length: RECENT_MAX }, (_, i) => ({ ...read(`a-${i}`), at: RECENT_MAX - i }));

    const again = withRecent(full, read("a-5"), 100);
    expect(again).toHaveLength(RECENT_MAX);
    expect(again[0]).toEqual({ ...read("a-5"), at: 100 });
    expect(again.filter((r) => r.slug === "a-5")).toHaveLength(1);

    const other = withRecent(full, read("a-5", "en"), 100);
    expect(other).toHaveLength(RECENT_MAX);
    expect(other.map((r) => `${r.locale}:${r.slug}`)).toContain("ja:a-5");
    expect(other.at(-1)?.slug).toBe(`a-${RECENT_MAX - 2}`);
  });
});
