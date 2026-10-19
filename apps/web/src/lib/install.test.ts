import { describe, expect, it } from "vitest";

import { isInAppBrowser } from "./install";

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
