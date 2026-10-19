import { describe, expect, it } from "vitest";

import { thumbWidth } from "./image";

describe("thumbWidth", () => {
  it("원본 폭을 알면 원본보다 작은 표준 폭만 고르고, 요청이 더 크면 원본에 가까운 썸네일이나 원본(null)을 쓴다", () => {
    expect(thumbWidth(1280, 1600)).toBe(1280);
    expect(thumbWidth(1280, 326)).toBeNull();
    expect(thumbWidth(500, 500)).toBeNull();
    // 586px 원본 PNG 2.5MB 를 통째로 받던 문제: 500px 썸네일(0.85배)을 쓴다
    expect(thumbWidth(960, 586)).toBe(500);
  });

  it("원본 폭을 모르면 960 안에서 고른다", () => {
    expect(thumbWidth(1280)).toBe(960);
    expect(thumbWidth(300)).toBe(330);
  });

  it("3배 화면용 후보(640·1200)는 그 아래 표준 폭으로 내린다", () => {
    expect(thumbWidth(640)).toBe(500);
    expect(thumbWidth(1200, 3000)).toBe(960);
  });
});
