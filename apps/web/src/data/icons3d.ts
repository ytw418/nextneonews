import type { CategoryKey } from "@kmedia/core";

import type { Section } from "./types";

// 3D 아이콘 (Microsoft Fluent Emoji 3D, MIT — public/icons3d/LICENSE). 160px PNG 를 우리 도메인에서 낸다.
// 강남언니·여신티켓처럼 아이콘 동그라미 메뉴와 사진 없는 썸네일에 쓴다
export const CATEGORY_ICON3D: Record<CategoryKey, string> = {
  KPOP: "/icons3d/kpop.png",
  KENT: "/icons3d/kent.png",
  KDRAMA: "/icons3d/kdrama.png",
  KFOOD: "/icons3d/kfood.png",
  KBEAUTY: "/icons3d/kbeauty.png",
  TRAVEL: "/icons3d/travel.png",
  STUDY: "/icons3d/study.png",
  LOVE: "/icons3d/love.png",
  WORKING_HOLIDAY: "/icons3d/working-holiday.png",
  JOBS: "/icons3d/jobs.png",
  HOUSING: "/icons3d/housing.png",
  LIFE: "/icons3d/life.png",
};

export const SECTION_ICON3D: Record<Section, string> = {
  beauty: "/icons3d/g-beauty.png",
  travel: "/icons3d/g-travel.png",
  clinic: "/icons3d/g-clinic.png",
  drama: "/icons3d/g-drama.png",
};
