import "server-only";

import { beautySlugs } from "@/data/beauty";
import { clinicSlugs } from "@/data/clinic";
import { dramaSlugs } from "@/data/drama";
import { travelSlugs } from "@/data/travel";
import type { Section } from "@/data/types";

// 섹션 타일의 '제품 50개 · 명소 36곳' 숫자. 카탈로그에 실제로 있는 항목 수 (여행은 명소 수)
const COUNT: Record<Section, () => number> = {
  beauty: () => beautySlugs().length,
  travel: () => travelSlugs().length,
  clinic: () => clinicSlugs().length,
  drama: () => dramaSlugs().length,
};

export function sectionCount(section: Section): number {
  return COUNT[section]();
}
