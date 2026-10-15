import { describe, expect, it } from "vitest";

import { nameMatches } from "./names";

describe("nameMatches", () => {
  it("조사가 붙은 이름은 잡고, 더 긴 이름의 일부·일상 단어·따옴표 없는 드라마 제목은 거른다", () => {
    expect(nameMatches("이지혜가 성심당 논란 해명", "이지혜", "actor")).toBe(true);
    expect(nameMatches("황정음, 전남편 이영돈에게", "이영", "actor")).toBe(false);
    expect(nameMatches("이지혜가 해명", "지혜", "singer")).toBe(false);
    expect(nameMatches("보아, 아이 키우는 근황", "아이", "group")).toBe(false);
    expect(nameMatches("서인영 개과천선 다짐", "개과천선", "series")).toBe(false);
    expect(nameMatches("드라마 ‘개과천선’ 출연", "개과천선", "series")).toBe(true);
    expect(nameMatches("IVE, Looks Can Kill 컴백", "IVE", "group")).toBe(true);
    expect(nameMatches("ACTIVE 활동", "IVE", "group")).toBe(false);
    expect(nameMatches("Kim Min-jong wins defamation case", "Min", "singer")).toBe(false);
  });
});
