import { describe, expect, it } from "vitest";

import { mixTrending, watchAvailability } from "./drama";

describe("mixTrending", () => {
  const card = (key: string) => ({ key });

  it("랭킹과 편집 추천을 번갈아 섞고 같은 작품은 한 번만 넣는다", () => {
    const ranked = ["entity:Q1", "queen-of-tears", "entity:Q2", "entity:Q3"].map(card);
    const curated = ["queen-of-tears", "goblin", "reply-1988"].map(card);
    expect(mixTrending(ranked, curated, 5).map((c) => c.key)).toEqual([
      "entity:Q1",
      "queen-of-tears",
      "entity:Q2",
      "goblin",
      "entity:Q3",
    ]);
  });

  it("랭킹이 비면 편집 추천만 쓴다", () => {
    expect(mixTrending([], ["a", "b", "c"].map(card), 2).map((c) => c.key)).toEqual(["a", "b"]);
  });
});

describe("watchAvailability", () => {
  it("공식 지역이 그 언어 독자 지역과 겹칠 때만 확정, 지역 자료가 없으면 확인 전", () => {
    expect(watchAvailability("ja", ["tw", "jp", "us"])).toEqual({ state: "confirmed", regions: ["jp"] });
    expect(watchAvailability("zh-TW", undefined)).toEqual({ state: "unconfirmed" });
    expect(watchAvailability("ru", ["tw", "jp"])).toEqual({ state: "unconfirmed" });
  });
});
