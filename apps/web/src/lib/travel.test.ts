import { describe, expect, it } from "vitest";

import { naverMapUrl, stampProgress } from "./travel";

describe("stampProgress", () => {
  it("이 동네 명소만 세고, 다 찍었을 때만 complete", () => {
    const area = ["kwangya-seoul", "seoul-forest", "cafe-onion-seongsu", "olive-young-n-seongsu"];
    // 다른 동네 도장(gyeongbokgung)은 세지 않는다
    expect(stampProgress(["gyeongbokgung", "seoul-forest", "kwangya-seoul"], area)).toEqual({
      done: 2,
      total: 4,
      percent: 50,
      complete: false,
    });
    expect(stampProgress([...area], area).complete).toBe(true);
    expect(stampProgress([], []).complete).toBe(false);
  });
});

describe("naverMapUrl", () => {
  it("괄호 안 별칭을 빼고 검색어로 넣는다", () => {
    expect(naverMapUrl("N서울타워(남산서울타워)")).toBe(
      `https://map.naver.com/p/search/${encodeURIComponent("N서울타워")}`,
    );
  });
});
