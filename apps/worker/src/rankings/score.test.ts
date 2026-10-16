import { describe, expect, it } from "vitest";

import { type Candidate, rankChart, rankRising } from "./score";

function cand(entityId: string, metrics: Record<string, number>, extra: Partial<Candidate> = {}): Candidate {
  return {
    entityId,
    names: { en: entityId, ko: null, ja: null, zhHant: null },
    krSignals: 1,
    wikiTitles: 1,
    metrics,
    ...extra,
  };
}

describe("랭킹 점수", () => {
  it("국내 신호나 위키 문서가 없으면 순위에서 뺀다", () => {
    const items = rankChart(
      [
        cand("Q1", { "theqoo:views": 900, "wiki:en": 5000 }),
        cand("Q2", { "wiki:en": 9000 }, { krSignals: 0 }),
        cand("Q3", { "theqoo:views": 5000 }, { wikiTitles: 0 }),
      ],
      null,
    );
    expect(items.map((i) => i.entityId)).toEqual(["Q1"]);
  });

  it("언어 scope 는 점수 대신 그 언어 위키의 성장률로 줄 세운다 (7일 500 미만·내림세는 뺀다)", () => {
    const items = rankRising(
      [
        cand("Q1", { "wiki:ja": 20000, "wiki:ja:prev": 19000, "theqoo:views": 99999 }),
        cand("Q2", { "wiki:ja": 1500, "wiki:ja:prev": 500 }),
        cand("Q3", { "wiki:ja": 400, "wiki:ja:prev": 10 }),
        cand("Q4", { "wiki:ja": 900, "wiki:ja:prev": 1200 }),
      ],
      "ja",
      null,
    );
    expect(items.map((i) => i.entityId)).toEqual(["Q2", "Q1"]);
    expect(items[0]!.metrics.growth).toBe(3);
  });

  it("어제 순위가 있으면 prevRank, 없으면 NEW, 5계단 이상 오르면 급상승", () => {
    const cands = [
      cand("Q1", { "theqoo:views": 9000, "wiki:en": 9000 }),
      cand("Q2", { "theqoo:views": 100, "wiki:en": 100 }),
      cand("Q3", { "theqoo:views": 10, "wiki:en": 10 }),
    ];
    const items = rankChart(cands, [
      { entityId: "Q1", rank: 7 },
      { entityId: "Q2", rank: 2 },
    ]);
    expect(items.map((i) => [i.entityId, i.prevRank, i.rising])).toEqual([
      ["Q1", 7, true],
      ["Q2", 2, false],
      ["Q3", null, false],
    ]);
  });
});
