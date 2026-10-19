import type { AffiliateTarget } from "../types";

// ₩ · ₩₩ · ₩₩₩ (₩=1만 원 미만, ₩₩=1~3만, ₩₩₩=3만 이상, 한국 정가 기준)
export type PriceTier = 1 | 2 | 3;
export type SkinType = "dry" | "oily" | "combination" | "sensitive" | "normal";
export type BeautyCategory =
  | "cleanser"
  | "toner"
  | "serum"
  | "moisturizer"
  | "sunscreen"
  | "mask"
  | "lip"
  | "base"
  | "eye"
  | "hair-body";

export const SKIN_TYPES: readonly SkinType[] = ["dry", "oily", "combination", "sensitive", "normal"];
export const BEAUTY_CATEGORIES: readonly BeautyCategory[] = [
  "cleanser",
  "toner",
  "serum",
  "moisturizer",
  "sunscreen",
  "mask",
  "lip",
  "base",
  "eye",
  "hair-body",
];

export interface BeautyProduct {
  slug: string;
  brand: string; // 브랜드 영문 표기 (언어 무관)
  category: BeautyCategory;
  skinTypes: SkinType[];
  priceTier: PriceTier;
  keyIngredients: string[]; // INCI 영문, 최대 4
  functional?: ("whitening" | "wrinkle" | "sun")[]; // 식약처 기능성 보고 제품만. 없으면 효능 표현 금지
  editorialScore: number; // 0~100
  buy: AffiliateTarget[]; // 최소 1, 최대 4. 파트너별 1개
  addedAt: string; // YYYY-MM-DD
  sources: string[]; // 공식 브랜드 제품 페이지 1개 이상
}

export interface BeautyProductText {
  name: string;
  tagline: string;
  why: string;
  howTo: string;
  caution?: string;
}
export type BeautyText = Record<string, BeautyProductText>; // slug → 문구

// 피부 타입 테스트 (src/data/beauty/skin-type.ts 의 SKIN_QUIZ, 문항 6)
export interface SkinQuizOption {
  id: string;
  weights: Partial<Record<SkinType, number>>;
}
export interface SkinQuizQuestion {
  id: string;
  options: SkinQuizOption[];
}
export interface SkinTypeText {
  title: string;
  intro: string;
  disclaimer: string;
  questions: Record<string, { q: string; options: Record<string, string> }>; // 문항 id → 질문, 보기 id → 보기 문구
  results: Record<SkinType, { name: string; oneLiner: string; tips: string[] }>; // tips 3개
}

// text/{locale}.json 한 파일의 모양
export interface BeautyTextFile {
  categories: Record<BeautyCategory, { name: string; intro: string }>;
  products: Record<string, BeautyProductText>; // slug → 문구
  skinType: SkinTypeText;
}
