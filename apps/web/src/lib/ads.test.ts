import { afterEach, describe, expect, it, vi } from "vitest";

import { articlePrepFor, COUPANG_BANNER, coupangBannerFor, coupangGateScript } from "./ads";

afterEach(() => {
  vi.unstubAllEnvs();
});

// <head> 인라인 스크립트를 가짜 location·시간대로 돌려 html[data-coupang] 이 붙는지 본다
function gateOpens(hostname: string, timeZone: string): boolean {
  const attributes = new Set<string>();
  new Function("location", "document", "Intl", coupangGateScript() ?? "")(
    { hostname },
    { documentElement: { setAttribute: (name: string) => attributes.add(name) } },
    { DateTimeFormat: () => ({ resolvedOptions: () => ({ timeZone }) }) },
  );
  return attributes.has("data-coupang");
}

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

  it("배너는 파트너스에 등록한 미디어 주소에서 한국 시간대일 때만 켠다", () => {
    vi.stubEnv("VERCEL_ENV", "production");
    expect(gateOpens("hallyu-brief.vercel.app", "Asia/Seoul")).toBe(true);
    expect(gateOpens("hallyu-brief.vercel.app", "Asia/Taipei")).toBe(false);
    expect(gateOpens("kmedia-git-dev.vercel.app", "Asia/Seoul")).toBe(false);
    expect(gateOpens("unnienote.app", "Asia/Seoul")).toBe(true);
  });
});

describe("articlePrepFor", () => {
  it("생활 글에만 여행 준비 줄을 eSIM 먼저 붙이고, 한국어판에는 붙이지 않는다", () => {
    expect(articlePrepFor("WORKING_HOLIDAY", "ja").map((row) => row.key)).toEqual(["esim", "airport", "stay"]);
    expect(articlePrepFor("KPOP", "en")).toEqual([]);
    expect(articlePrepFor("TRAVEL", "ko")).toEqual([]);
  });
});
