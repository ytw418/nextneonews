import { describe, expect, it } from "vitest";

import { rankAwards } from "./beauty";

const totals = (love: number, ok: number, meh: number) => ({
  totals: { love, ok, meh },
  byFacet: {},
  total: love + ok + meh,
});

describe("rankAwards", () => {
  it("편집 점수 + 25 × (인생템 − 별로) ÷ (표 + 5) 순으로, 같으면 최근에 넣은 것이 먼저", () => {
    const items = [
      { slug: "a", editorialScore: 90, addedAt: "2026-10-01" }, // 90 + 25 × (0 − 15) ÷ 20 = 71.25
      { slug: "b", editorialScore: 80, addedAt: "2026-10-01" }, // 80 + 25 × 15 ÷ 20 = 98.75
      { slug: "c", editorialScore: 85, addedAt: "2026-10-01" }, // 표 없음 85
      { slug: "d", editorialScore: 85, addedAt: "2026-10-19" }, // 85, c 와 같고 더 최근
    ];
    const votes = new Map([
      ["a", totals(0, 0, 15)],
      ["b", totals(15, 0, 0)],
    ]);

    const ranked = rankAwards(items, votes);

    expect(ranked.map((r) => [r.item.slug, r.score, r.rank])).toEqual([
      ["b", 98.75, 1],
      ["d", 85, 2],
      ["c", 85, 3],
      ["a", 71.25, 4],
    ]);
  });
});
