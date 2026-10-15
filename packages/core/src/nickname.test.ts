import { describe, expect, it } from "vitest";

import { FRIENDLY } from "./comments";
import { displayNickname } from "./nickname";

const SECRET = "test-secret";

describe("displayNickname", () => {
  it("닉네임이 있으면 그 이름만, 없으면 언어별 귀여운 이름 (해시 꼬리 없음)", () => {
    expect(displayNickname({ ip: "1.2.3.4", articleId: "a1", locale: "ja", nickname: " 元気なウサギ " }, SECRET)).toBe(
      "元気なウサギ",
    );
    const ja = displayNickname({ ip: "1.2.3.4", articleId: "a1", locale: "ja" }, SECRET);
    expect(ja).not.toMatch(/\(/);
    expect(FRIENDLY.ja.animals.some((animal) => ja.endsWith(animal))).toBe(true);
  });

  it("같은 글에서는 같은 IP가 같은 이름, 다른 글에서는 다른 이름", () => {
    const first = displayNickname({ ip: "1.2.3.4", articleId: "a1", locale: "ko" }, SECRET);
    const again = displayNickname({ ip: "1.2.3.4", articleId: "a1", locale: "ko", nickname: "  " }, SECRET);
    const otherArticle = displayNickname({ ip: "1.2.3.4", articleId: "a2", locale: "ko" }, SECRET);

    expect(again).toBe(first);
    expect(otherArticle).not.toBe(first);
  });

  it("모든 언어의 모든 조합이 서버 닉네임 최대 길이(20자) 안", () => {
    for (const { adjectives, animals, format } of Object.values(FRIENDLY)) {
      expect(adjectives).toHaveLength(12);
      expect(animals).toHaveLength(12);
      const longest = Math.max(...adjectives.flatMap((a) => animals.map((b) => format(a, b).length)));
      expect(longest).toBeLessThanOrEqual(20);
    }
  });
});
