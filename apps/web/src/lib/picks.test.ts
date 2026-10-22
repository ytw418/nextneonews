import { describe, expect, it } from "vitest";

import { parsePicks, PICKS_MAX, type PickItem, withToggled } from "./picks";

const pick = (id: string) => ({ id, name: id, slug: id.toLowerCase(), avatar: null, tint: "#fde" });

describe("내 최애", () => {
  it("누르면 넣고, 다시 누르면 뺀다. 고른 순서를 지킨다", () => {
    const one = withToggled([], pick("Q1"), 1);
    const two = withToggled(one, pick("Q2"), 2);
    expect(two.map((p) => p.id)).toEqual(["Q1", "Q2"]);
    expect(withToggled(two, pick("Q1"), 3).map((p) => p.id)).toEqual(["Q2"]);
  });

  it("꽉 차면 더 넣지 않는다 (먼저 고른 사람을 몰래 빼지 않는다)", () => {
    let list: PickItem[] = [];
    for (let i = 0; i < PICKS_MAX; i++) list = withToggled(list, pick(`Q${i}`), i);
    const full = withToggled(list, pick("Q99"), 99);
    expect(full).toHaveLength(PICKS_MAX);
    expect(full.map((p) => p.id)).not.toContain("Q99");
  });

  it("손상된 값·겹친 사람은 버리고 상한까지만 읽는다", () => {
    expect(parsePicks(null)).toEqual([]);
    expect(parsePicks("{not json")).toEqual([]);
    expect(parsePicks(JSON.stringify({ id: "Q1" }))).toEqual([]);
    const raw = JSON.stringify([
      { ...pick("Q1"), at: 1 },
      { ...pick("Q1"), at: 2 },
      { id: "Q2", name: 3 },
      ...["Q3", "Q4", "Q5", "Q6"].map((id, i) => ({ ...pick(id), at: i })),
    ]);
    const list = parsePicks(raw);
    expect(list.map((p) => p.id)).toEqual(["Q1", "Q3", "Q4"].slice(0, PICKS_MAX));
  });
});
