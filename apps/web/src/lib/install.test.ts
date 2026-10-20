import { describe, expect, it } from "vitest";

import { isInAppBrowser, platformOf } from "./install";

describe("앱 안 브라우저 판별", () => {
  it("스레드 앱 안 브라우저(UA 에 Instagram 이 없다)는 잡고 사파리는 아니다", () => {
    const threads =
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Barcelona 361.0.0.29.92 (iPhone15,3; iOS 18_6; zh_TW; zh-Hant-TW)";
    const safari =
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1";
    expect(isInAppBrowser(threads)).toBe(true);
    expect(isInAppBrowser(safari)).toBe(false);
  });
});

describe("열린 곳(platform) 판별", () => {
  it("언니노트 앱 웹뷰(UA 꼬리표)가 홈 화면 앱·브라우저보다 먼저이고, 앱 웹뷰를 '앱 안 브라우저'로 보지 않는다", () => {
    const app =
      "Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 UnnieNoteApp/1.0.0";
    const safari =
      "Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1";
    expect(platformOf(app, true)).toBe("app");
    expect(platformOf(safari, true)).toBe("pwa");
    expect(platformOf(safari, false)).toBe("web");
    expect(isInAppBrowser(app)).toBe(false);
  });
});
