import { describe, expect, it } from "vitest";

import { englishSubject, nameMatches, subjectIndex } from "./names";

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

  // 장원영 기사에 정해인 사진이 붙었던 일
  it("곁가지로 나온 이름(…도, from·and 뒤)은 대표 사진 주인공이 아니다", () => {
    const ko = "정해인·지디도 '♥좋아요' 눌렀다…장원영, 무보정+단화 조합에도 언빌리버블 비율";
    expect(subjectIndex(ko, ["정해인", "Jung Hae-in"])).toBe(-1);
    expect(subjectIndex("장원영·안유진, 시상식 참석", ["장원영"])).toBe(0);
    const en = "IVE's Jang Won-young at Singapore F1 Event Draws Likes From Jung Hae-in and G-Dragon";
    expect(englishSubject(en, ["Jung Hae-in"])).toBe(false);
    expect(englishSubject(en, ["G-Dragon", "G Dragon"])).toBe(false);
    expect(englishSubject(en, ["Jang Won-young"])).toBe(true);
    expect(englishSubject(en, ["IVE"])).toBe(true);
  });
});
