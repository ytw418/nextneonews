import { describe, expect, it } from "vitest";

import { evaluate, totalScore } from "./heuristics";

const IU = { type: "singer", ko: "아이유", en: "IU", sitelinks: 69 };

describe("evaluate", () => {
  it("해외에 유명한 인물의 공식 소식은 통과 점수, 일반인 판 사연은 낮은 점수", () => {
    const star = evaluate({ title: "[공식] 아이유, 12월 도쿄 팬미팅 확정", source: "yonhap" }, [IU]);
    expect(star).toMatchObject({ foreignInterest: 5, answerable: 5, category: "KPOP", format: "ISSUE", risk: "GREEN", keyword: "아이유" });
    expect(totalScore(star, { rank: 3 })).toBeGreaterThanOrEqual(16);

    const story = evaluate({ title: "남친이 연락을 안 해요 어떡하죠", source: "theqoo" }, []);
    expect(story).toMatchObject({ foreignInterest: 1, answerable: 2, format: "REACTION" });
    expect(totalScore(story, { rank: 3 })).toBeLessThan(16);
  });

  it("논란 단어는 YELLOW, 외국인 생활 정보는 인물이 없어도 관심도를 올린다", () => {
    expect(evaluate({ title: "아이유 열애설에 소속사 해명", source: "yonhap" }, [IU]).risk).toBe("YELLOW");
    const visa = evaluate({ title: "워홀 비자 신청 방법 총정리", source: "yonhap" }, []);
    expect(visa).toMatchObject({ foreignInterest: 4, category: "WORKING_HOLIDAY", format: "GUIDE" });
  });

  it("연예인이 없으면 단어로 생활 카테고리를 고르고, 연예인이 있으면 연예 카테고리로 둔다", () => {
    expect(evaluate({ title: "외국인 국제결혼 F-6 비자 서류 총정리", source: "yonhap" }, []).category).toBe("LOVE");
    expect(evaluate({ title: "GKS 정부초청 장학생 모집 시작", source: "yonhap" }, []).category).toBe("STUDY");
    expect(evaluate({ title: "올리브영 외국인 인기 선크림 순위", source: "yonhap" }, []).category).toBe("KBEAUTY");
    expect(evaluate({ title: "아이유 결혼식 하객 패션 화제", source: "yonhap" }, [IU]).category).toBe("KPOP");
  });

  it("연예인·생활 단어가 없는 일반 뉴스는 관련 없음으로 둔다", () => {
    expect(evaluate({ title: "9월 수출 1천2백억 달러 첫 돌파…반도체 호조", source: "yonhap" }, []).relevant).toBe(false);
    expect(evaluate({ title: "외국인 관광객 택스리펀 기준 바뀐다", source: "yonhap" }, []).relevant).toBe(true);
    // 해외 축구·코인은 사전에 걸린 이름이 있어도 무관 (2026-10-19 레알 마드리드 기사가 K-POP 으로 발행됐다)
    expect(evaluate({ title: "레알 마드리드, 세비야 4-1 꺾고 선두", source: "yonhap" }, [IU]).relevant).toBe(false);
    expect(evaluate({ title: "스테이블코인 결제, 전 세계 매장으로 확산", source: "yonhap" }, []).relevant).toBe(false);
  });
});
