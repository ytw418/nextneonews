import { describe, expect, it } from "vitest";

import { guideIndexable } from "./guide-seo";

describe("guideIndexable", () => {
  it("가이드는 en·ja·zh-TW 만, 치과·성형 시술은 어느 언어도 색인하지 않는다", () => {
    expect(guideIndexable("zh-TW", "/beauty/p/cosrx-snail-mucin-essence")).toBe(true);
    expect(guideIndexable("vi", "/beauty")).toBe(false);
    expect(guideIndexable("en", "/clinic/botox")).toBe(true);
    expect(guideIndexable("en", "/clinic/implant")).toBe(false);
    // 가이드가 아닌 경로(글·랭킹)는 여기서 정하지 않는다
    expect(guideIndexable("vi", "/rankings")).toBe(true);
  });
});
