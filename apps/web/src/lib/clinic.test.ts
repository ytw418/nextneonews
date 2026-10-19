import { describe, expect, it } from "vitest";

import { CLINIC_ITEMS } from "../data/clinic/items";
import { isMultiVisit, koreanLines, sessionPlan } from "./clinic";

describe("시술 회차", () => {
  it("카탈로그의 회차 문장을 모두 읽고, 여러 번 가야 하는 시술만 짧은 여행 경고 대상이 된다", () => {
    // 데이터 문장을 바꿨는데 규칙이 못 읽으면 사실 표의 '횟수' 칸이 비므로 여기서 먼저 걸린다
    for (const item of CLINIC_ITEMS) {
      if (item.sessions) expect(sessionPlan(item.sessions), item.slug).not.toBeNull();
    }
    const multi = CLINIC_ITEMS.filter((i) => isMultiVisit(sessionPlan(i.sessions))).map((i) => i.slug);
    expect(multi).toEqual([
      "laser-toning",
      "rejuran",
      "skin-booster",
      "aqua-peel",
      "laminate",
      "implant",
      "clear-aligner",
      "fat-grafting",
    ]);

    expect(sessionPlan("Often more than 1 session")).toEqual({ kind: "count", min: 2, max: null });
    expect(sessionPlan("Up to 3 sessions, then maintenance every 4–6 months")).toEqual({ kind: "count", min: 1, max: 3 });
    expect(sessionPlan("Typically every 6–12 months")).toEqual({ kind: "periodic" });
  });
});

describe("한국어로 보여 주기", () => {
  it("한국어 문구가 영어로 채워진 것이거나 줄 수가 다르면 짝을 짓지 않는다", () => {
    const en = ["How many sessions?", "What is the total cost?"];
    const ja = ["何回必要ですか？", "総額はいくらですか？"];
    const ko = ["몇 번 받아야 하나요?", "총비용은 얼마인가요?"];
    expect(koreanLines(ja, ko, en)).toEqual(ko);
    expect(koreanLines(ja, en, en)).toBeNull(); // ko 파일에 없어 영어가 채워짐
    expect(koreanLines(ja, ko.slice(0, 1), en)).toBeNull();
    expect(koreanLines(ja, undefined, en)).toBeNull();
  });
});
