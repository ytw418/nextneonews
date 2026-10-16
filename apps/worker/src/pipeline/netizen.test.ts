import { describe, expect, it } from "vitest";

import { sampleComments, validMix } from "./netizen";

describe("sampleComments", () => {
  it("태그·URL·멘션을 지우고 짧은 것·중복·비하 표현을 뺀 뒤 120자로 자른다", () => {
    const long = "가".repeat(200);
    expect(
      sampleComments([
        "<b>무대 찢었다</b> 진짜 https://t.co/abc",
        "무대 찢었다 진짜",
        "@익명 이번 앨범 최고",
        "ㅋㅋㅋ",
        "짱깨들은 왜 이래",
        "한남동 팝업 가보고 싶다",
        long,
      ]),
    ).toEqual(["무대 찢었다 진짜", "이번 앨범 최고", "한남동 팝업 가보고 싶다", "가".repeat(120)]);
  });
});

describe("validMix", () => {
  it("0 이상 정수이고 합이 100 일 때만 받는다", () => {
    expect(validMix({ support: 60, funny: 25, critical: 10, neutral: 5 })).toEqual({
      support: 60,
      funny: 25,
      critical: 10,
      neutral: 5,
    });
    expect(validMix({ support: 60, funny: 25, critical: 10, neutral: 4 })).toBeNull();
    expect(validMix({ support: 60.5, funny: 24.5, critical: 10, neutral: 5 })).toBeNull();
  });
});
