import { describe, expect, it } from "vitest";

import { pickNext } from "./next-article";

const rows = (...slugs: string[]) => slugs.map((slug) => ({ slug }));

describe("pickNext", () => {
  const pools = {
    sameEntity: rows("cur", "e1", "e2"),
    guide: rows("g1", "g2"),
    sameCategory: rows("e1", "c1"),
    popular: rows("p1", "c1", "p2"),
  };

  it("같은 인물 → 가이드 1개 → 같은 카테고리 → 인기 순, 지금 글·중복 제외, 최대 6개", () => {
    const out = pickNext({ slug: "cur", category: "KPOP", hasEvent: true }, pools).map((r) => r.slug);
    expect(out).toEqual(["e1", "e2", "g1", "c1", "p1", "p2"]);
  });

  it("일정이 없거나 연예 글이 아니면 가이드를 넣지 않는다", () => {
    const noEvent = pickNext({ slug: "cur", category: "KPOP", hasEvent: false }, pools).map((r) => r.slug);
    const notEnt = pickNext({ slug: "cur", category: "TRAVEL", hasEvent: true }, pools).map((r) => r.slug);
    expect(noEvent).toEqual(["e1", "e2", "c1", "p1", "p2"]);
    expect(notEnt).toEqual(noEvent);
  });
});
