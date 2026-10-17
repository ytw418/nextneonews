import { describe, expect, it } from "vitest";

import { COUPANG_BANNER, coupangBannerFor } from "./ads";

describe("coupangBannerFor", () => {
  it("한국어는 연예·국내 반응을 뺀 글에 붙이고, 뷰티·푸드는 그 카테고리 베스트", () => {
    expect(coupangBannerFor({ locale: "ko", category: "KBEAUTY", format: "GUIDE" })).toBe(COUPANG_BANNER.beauty);
    expect(coupangBannerFor({ locale: "ko", category: "KFOOD", format: "LIST" })).toBe(COUPANG_BANNER.food);
    expect(coupangBannerFor({ locale: "ko", category: "TRAVEL", format: "ISSUE" })).toBe(COUPANG_BANNER.general);
    expect(coupangBannerFor({ locale: "ko", category: "KPOP", format: "GUIDE" })).toBeNull();
    expect(coupangBannerFor({ locale: "ko", category: "LIFE", format: "REACTION" })).toBeNull();
  });

  it("다른 언어는 한국 생활 카테고리에만 개인화 추천", () => {
    expect(coupangBannerFor({ locale: "en", category: "HOUSING", format: "GUIDE" })).toBe(COUPANG_BANNER.general);
    expect(coupangBannerFor({ locale: "ja", category: "KBEAUTY", format: "GUIDE" })).toBeNull();
    expect(coupangBannerFor({ locale: "en", category: "HOUSING", format: "REACTION" })).toBeNull();
  });
});
