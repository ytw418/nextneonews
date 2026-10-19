import type { SkinQuizQuestion } from "./types";

// 피부 타입 테스트 (재미용, 의학적 진단 아님). 보기마다 가중치를 더해 가장 높은 타입이 결과다.
// 동점이면 화면(P1)이 정한 순서로 고른다. 문구는 text/{locale}.json 의 skinType.questions[문항 id].
export const SKIN_QUIZ: SkinQuizQuestion[] = [
  {
    id: "afternoon",
    options: [
      { id: "tight", weights: { dry: 2 } },
      { id: "shiny-all", weights: { oily: 2 } },
      { id: "shiny-t", weights: { combination: 2 } },
      { id: "comfortable", weights: { normal: 2 } },
    ],
  },
  {
    id: "after-wash",
    options: [
      { id: "tight", weights: { dry: 2 } },
      { id: "sting", weights: { sensitive: 2 } },
      { id: "fine", weights: { normal: 2, oily: 1 } },
    ],
  },
  {
    id: "pores",
    options: [
      { id: "large-all", weights: { oily: 2 } },
      { id: "t-zone", weights: { combination: 2 } },
      { id: "barely", weights: { dry: 1, normal: 1 } },
    ],
  },
  {
    id: "new-product",
    options: [
      { id: "often", weights: { sensitive: 3 } },
      { id: "sometimes", weights: { sensitive: 1, combination: 1 } },
      { id: "rarely", weights: { normal: 2, oily: 1 } },
    ],
  },
  {
    id: "makeup",
    options: [
      { id: "patchy", weights: { dry: 2 } },
      { id: "slides", weights: { oily: 2 } },
      { id: "t-fade", weights: { combination: 2 } },
      { id: "stays", weights: { normal: 2 } },
    ],
  },
  {
    id: "weather",
    options: [
      { id: "flaky", weights: { dry: 2 } },
      { id: "flushed", weights: { sensitive: 2 } },
      { id: "mixed", weights: { combination: 2 } },
      { id: "same", weights: { normal: 1, oily: 1 } },
    ],
  },
];
