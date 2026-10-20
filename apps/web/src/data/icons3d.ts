import type { CategoryKey } from "@kmedia/core";

import type { Section } from "./types";

// 3D 아이콘 (Microsoft Fluent Emoji 3D, MIT — public/icons3d/LICENSE). 160px PNG 원본을 WebP 로 바꿔 우리 도메인에서 낸다
// (scripts/icons3d-webp.mjs, PNG 328KB → WebP 41KB). 아이콘을 바꾸면 PNG 를 넣고 스크립트를 다시 돌린다.
// 강남언니·여신티켓처럼 아이콘 동그라미 메뉴와 사진 없는 썸네일에 쓴다
export const CATEGORY_ICON3D: Record<CategoryKey, string> = {
  KPOP: "/icons3d/kpop.webp",
  KENT: "/icons3d/kent.webp",
  KDRAMA: "/icons3d/kdrama.webp",
  KFOOD: "/icons3d/kfood.webp",
  KBEAUTY: "/icons3d/kbeauty.webp",
  TRAVEL: "/icons3d/travel.webp",
  STUDY: "/icons3d/study.webp",
  LOVE: "/icons3d/love.webp",
  WORKING_HOLIDAY: "/icons3d/working-holiday.webp",
  JOBS: "/icons3d/jobs.webp",
  HOUSING: "/icons3d/housing.webp",
  LIFE: "/icons3d/life.webp",
};

export const SECTION_ICON3D: Record<Section, string> = {
  beauty: "/icons3d/g-beauty.webp",
  travel: "/icons3d/g-travel.webp",
  clinic: "/icons3d/g-clinic.webp",
  drama: "/icons3d/g-drama.webp",
};
