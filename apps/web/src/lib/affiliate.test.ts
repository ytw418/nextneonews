import { afterEach, describe, expect, it, vi } from "vitest";

import { affiliateHref } from "./affiliate";

// server-only 는 Next 서버 번들 밖(vitest)에서 import 하면 던진다
vi.mock("server-only", () => ({}));

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("affiliateHref", () => {
  it("값에 {url} 이 있으면 원 주소를 인코딩해 끼운다 (딥링크 템플릿)", () => {
    vi.stubEnv("AFFILIATE_KLOOK", "https://invol.co/aff_m?offer_id=1&aff_id=2&url={url}");
    expect(affiliateHref({ partner: "klook", url: "https://www.klook.com/en-US/esim/?a=1&b=2" })).toEqual({
      href: "https://invol.co/aff_m?offer_id=1&aff_id=2&url=https%3A%2F%2Fwww.klook.com%2Fen-US%2Fesim%2F%3Fa%3D1%26b%3D2",
      tagged: true,
      partner: "klook",
    });
  });

  it("값이 ? 로 시작하면 원 주소 쿼리에 합친다", () => {
    vi.stubEnv("AFFILIATE_AMAZON", "?tag=unnienote-20");
    expect(affiliateHref({ partner: "amazon", url: "https://www.amazon.com/dp/B0ABC?th=1" })).toEqual({
      href: "https://www.amazon.com/dp/B0ABC?th=1&tag=unnienote-20",
      tagged: true,
      partner: "amazon",
    });
  });

  it("값이 비면 원 주소 그대로, tagged:false", () => {
    vi.stubEnv("AFFILIATE_OLIVEYOUNG", " ");
    const url = "https://global.oliveyoung.com/product/detail?prdtNo=GA123";
    expect(affiliateHref({ partner: "oliveyoung", url })).toEqual({ href: url, tagged: false, partner: "oliveyoung" });
  });
});
