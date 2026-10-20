import { describe, expect, it } from "vitest";

import {
  headlineTooLong,
  kanaNames,
  looksLikeLocale,
  overlapRatio,
  replaceKana,
  stripHangulParens,
  unsupportedNumbers,
} from "./checks";

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

describe("headlineTooLong", () => {
  it("언어별 상한을 글자(grapheme) 수로 센다: 같은 길이라도 한국어는 넘고 영어는 통과", () => {
    const ko = "아이브, 10월 컴백 확정… 새 미니앨범 '러브 다이브 2'로 돌아온다고 소속사 발표"; // 47자
    expect(headlineTooLong("ko", ko)).toBe(true);
    expect(headlineTooLong("en", ko)).toBe(false);
    expect(headlineTooLong("ko", "아이브, 10월 컴백 확정")).toBe(false);
    // 베트남어 성조를 결합 문자로 쓴 글자(e + U+0302 + U+0301)도 한 글자로 센다: 60글자는 통과, 61글자는 넘는다
    const e = "e\u0302\u0301";
    expect(headlineTooLong("vi", e.repeat(60))).toBe(false);
    expect(headlineTooLong("vi", e.repeat(61))).toBe(true);
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

describe("replaceKana", () => {
  it("일본어판이 아닌 글에 남은 가나 이름을 사전 표기로 바꾸고, 사전에 없는 가나는 남은 것으로 알린다", () => {
    const names = kanaNames([{ ja: "イム・シワン", ko: "임시완", en: "Yim Si-wan", zhHant: "任時完" }], "zh-TW");
    const { value, left } = replaceKana(
      { title: "《我的有罪之人》イム・シワン 與薛仁雅攜手", faq: [{ q: "イムシワン是誰？", a: "演員。" }] },
      names,
    );
    expect(value).toEqual({ title: "《我的有罪之人》任時完 與薛仁雅攜手", faq: [{ q: "任時完是誰？", a: "演員。" }] });
    expect(left).toEqual([]);
    expect(replaceKana("ソル・イナ與任時完", names).left).toEqual(["ソル・イナ"]);
    expect(looksLikeLocale("zh-TW", "《我的有罪之人》イム・シワン 與薛仁雅攜手")).toBe(false);
    // 이름 사이 가운뎃점만 있는 대만 글은 정상
    expect(looksLikeLocale("zh-TW", "崔正勳・韓志旼分手傳聞")).toBe(true);
    expect(replaceKana("崔正勳・韓志旼", names).left).toEqual([]);
  });
});

describe("overlapRatio", () => {
  it("원문 문장을 그대로 옮기면 높고, 새로 쓰면 낮다", () => {
    const source = "배우 이영애가 15일 열린 제16회 뷰티풀 아티스트 어워즈 시상식에 남편과 함께 참석했다.";
    expect(overlapRatio(source, source)).toBe(1);
    expect(overlapRatio(source, "15일 시상식 현장에는 이영애 부부가 나란히 모습을 드러냈다.")).toBeLessThan(0.2);
  });
});
