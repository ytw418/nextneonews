import { describe, expect, it } from "vitest";

import { ruleFilter } from "./ruleFilter";

describe("ruleFilter", () => {
  it("금지 주제·조회수 미달은 버리고, 같은 주제는 순위가 높은 것만 남긴다", () => {
    const { passed, rejected } = ruleFilter([
      { id: "red", title: "배우 A 별세… 향년 80세", metrics: { rank: 1, views: 90000 } },
      { id: "low", title: "요즘 고민이 있는데요", metrics: { rank: 40, views: 500 } },
      { id: "dup-low-rank", title: "[단독] IVE 10월 컴백 확정!", metrics: { rank: 9, views: 20000 } },
      { id: "dup-high-rank", title: "IVE 10월 컴백 확정", metrics: { rank: 2, views: 50000 } },
      { id: "ok", title: "MAMA 2026 오사카 라인업 공개", metrics: { rank: 3, views: 40000 } },
    ]);

    expect(passed.map((p) => p.id).sort()).toEqual(["dup-high-rank", "ok"]);
    expect(Object.fromEntries(rejected.map((r) => [r.item.id, r.reason]))).toEqual({
      red: "red:별세",
      low: "low-views",
      "dup-low-rank": "duplicate",
    });
  });
});
