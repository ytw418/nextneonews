import { describe, expect, it } from "vitest";

import { thumbWidth } from "./image";

describe("thumbWidth", () => {
  it("원본 폭을 알면 원본보다 작은 표준 폭만 고르고, 요청이 더 크면 원본(null)을 쓴다", () => {
    expect(thumbWidth(1280, 1600)).toBe(1280);
    expect(thumbWidth(1280, 326)).toBeNull();
    expect(thumbWidth(500, 500)).toBeNull();
  });

  it("원본 폭을 모르면 960 안에서 고른다", () => {
    expect(thumbWidth(1280)).toBe(960);
    expect(thumbWidth(300)).toBe(330);
  });
});
