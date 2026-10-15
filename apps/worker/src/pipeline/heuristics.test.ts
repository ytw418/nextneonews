import { describe, expect, it } from "vitest";

import { evaluate, totalScore } from "./heuristics";

const IU = { type: "singer", ko: "아이유", en: "IU", sitelinks: 69 };

describe("evaluate", () => {
  it("해외에 유명한 인물의 공식 소식은 통과 점수, 일반인 판 사연은 낮은 점수", () => {
    const star = evaluate({ title: "[공식] 아이유, 12월 도쿄 팬미팅 확정", source: "naver-entertain" }, [IU]);
    expect(star).toMatchObject({ foreignInterest: 5, answerable: 5, category: "KPOP", format: "ISSUE", risk: "GREEN", keyword: "아이유" });
    expect(totalScore(star, { rank: 3 })).toBeGreaterThanOrEqual(16);

    const story = evaluate({ title: "남친이 연락을 안 해요 어떡하죠", source: "pann" }, []);
    expect(story).toMatchObject({ foreignInterest: 1, answerable: 2, format: "REACTION" });
    expect(totalScore(story, { rank: 3 })).toBeLessThan(16);
  });

  it("논란 단어는 YELLOW, 외국인 생활 정보는 인물이 없어도 관심도를 올린다", () => {
    expect(evaluate({ title: "아이유 열애설에 소속사 해명", source: "naver-entertain" }, [IU]).risk).toBe("YELLOW");
    const visa = evaluate({ title: "워홀 비자 신청 방법 총정리", source: "naver-entertain" }, []);
    expect(visa).toMatchObject({ foreignInterest: 4, category: "WORKING_HOLIDAY", format: "GUIDE" });
  });
});
