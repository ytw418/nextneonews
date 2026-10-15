import { describe, expect, it } from "vitest";

import { displayNickname } from "./nickname";

const SECRET = "test-secret";

describe("displayNickname", () => {
  it("닉네임이 없으면 언어별 익명 이름 + 해시 4자리", () => {
    const ja = displayNickname({ ip: "1.2.3.4", articleId: "a1", locale: "ja" }, SECRET);
    expect(ja).toMatch(/^名無しさん\([0-9a-f]{4}\)$/);
  });

  it("같은 글에서는 같은 IP가 같은 ID, 다른 글에서는 다른 ID", () => {
    const first = displayNickname({ ip: "1.2.3.4", articleId: "a1", locale: "ko" }, SECRET);
    const again = displayNickname({ ip: "1.2.3.4", articleId: "a1", locale: "ko", nickname: "  " }, SECRET);
    const otherArticle = displayNickname({ ip: "1.2.3.4", articleId: "a2", locale: "ko" }, SECRET);

    expect(again).toBe(first);
    expect(otherArticle).not.toBe(first);
  });
});
