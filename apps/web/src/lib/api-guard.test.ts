import { describe, expect, it } from "vitest";

import { isCrossSite } from "./api-guard";

describe("쓰기 API 출처 검사", () => {
  it("다른 사이트가 방문자 브라우저로 보낸 표는 막고, 같은 출처 sendBeacon·옛 브라우저·로컬 주소는 통과시킨다", () => {
    // 공격 페이지의 fetch(no-cors, text/plain): 브라우저가 Origin 과 Sec-Fetch-Site 를 붙인다
    expect(isCrossSite(new Headers({ origin: "http://127.0.0.1:8977", "sec-fetch-site": "cross-site" }))).toBe(true);
    // 조회 수 sendBeacon (본문·content-type 없음)
    expect(isCrossSite(new Headers({ "sec-fetch-site": "same-origin" }))).toBe(false);
    // Sec-Fetch-Site 를 모르는 옛 브라우저는 Origin 과 Host 를 견준다 (SITE_URL 이 아니라 Host: 휴대폰으로 연 로컬 서버)
    expect(isCrossSite(new Headers({ origin: "http://192.168.0.200:3400", host: "192.168.0.200:3400" }))).toBe(false);
    expect(isCrossSite(new Headers({ origin: "https://evil.example", host: "unnienote.app" }))).toBe(true);
  });
});
