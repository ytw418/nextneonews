import { describe, expect, it } from "vitest";

import { looksLikeLocale, overlapRatio, stripHangulParens, unsupportedNumbers } from "./checks";

describe("unsupportedNumbers", () => {
  it("facts 에 없는 두 자리 이상 숫자만 잡고, 천 단위 콤마 차이는 무시한다", () => {
    const missing = unsupportedNumbers({
      facts: [{ statement: "The concert on 11/20 drew 45000 fans in Osaka." }],
      summary: "About 45,000 fans gathered.",
      body: "It was held on 11/20 and tickets cost 154000 won. Top 3 moments below.",
      faq: [{ q: "When?", a: "On 11/20." }],
    });
    expect(missing).toEqual(["154000"]);
  });
});

describe("stripHangulParens", () => {
  it("한글이 든 괄호만 지우고 나머지 괄호는 남긴다", () => {
    expect(stripHangulParens("大田の聖心堂(성심당)とMBC（문화방송）、Disney+（日本）")).toBe("大田の聖心堂とMBC、Disney+（日本）");
  });
});

describe("looksLikeLocale", () => {
  it("요청한 언어가 아닌 번역(예: 러시아어 자리에 한국어)을 걸러낸다", () => {
    expect(looksLikeLocale("ru", "배우 이영애가 남편과 함께 참석했다.")).toBe(false);
    expect(looksLikeLocale("ru", "Актриса Ли Ён Э посетила церемонию вместе с мужем.")).toBe(true);
    expect(looksLikeLocale("ru", `${"Актриса Ли Ён Э посетила церемонию вместе с мужем. ".repeat(5)}(이영애)`)).toBe(true);
    expect(looksLikeLocale("vi", "Nữ diễn viên Lee Young-ae đã tham dự lễ trao giải.")).toBe(true);
    expect(looksLikeLocale("fr", "Lee Young-ae attended the ceremony with her husband.")).toBe(false);
    expect(looksLikeLocale("fr", "L'actrice a assisté à la cérémonie avec son mari et les invités.")).toBe(true);
    expect(looksLikeLocale("id", "Aktris ini hadir bersama suaminya di upacara yang meriah.")).toBe(true);
  });
});

describe("overlapRatio", () => {
  it("원문 문장을 그대로 옮기면 높고, 새로 쓰면 낮다", () => {
    const source = "배우 이영애가 15일 열린 제16회 뷰티풀 아티스트 어워즈 시상식에 남편과 함께 참석했다.";
    expect(overlapRatio(source, source)).toBe(1);
    expect(overlapRatio(source, "15일 시상식 현장에는 이영애 부부가 나란히 모습을 드러냈다.")).toBeLessThan(0.2);
  });
});
