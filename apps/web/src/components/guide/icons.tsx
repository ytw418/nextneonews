import type { ComponentType } from "react";

import { BookIcon, ClapperIcon, PlaneIcon, SparkleIcon, SunIcon } from "@/components/icons";
import type { CatalogKind } from "@/data/sections";
import type { SavedKind, Section } from "@/data/types";

// 가이드 전용 선 아이콘 (components/icons.tsx 와 같은 규칙: 1.8px 선, 24px 격자, currentColor)
const base = {
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

interface IconProps {
  className?: string;
}

const RING = "M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 1 0 0-17z";
// 절대 좌표로 시작한다: 채운 아이콘에서 원 뒤에 이어 붙인다
const NEEDLE = "M16.2 7.8l-2.6 5.8-5.8 2.6 2.6-5.8z";

// 하단 탭 '가이드' (나침반)
export const CompassIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d={RING} />
    <path d={NEEDLE} />
  </svg>
);

// 선택된 탭용: 원을 채우고 바늘 자리는 뚫는다. 선을 그으면 구멍이 메워져서 선 없이, 원은 선 두께 반만큼 키운다
const DISC = "M12 2.6a9.4 9.4 0 1 0 0 18.8 9.4 9.4 0 1 0 0-18.8z";
export const CompassFilledIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d={`${DISC}${NEEDLE}`} fill="currentColor" fillRule="evenodd" stroke="none" />
  </svg>
);

// 섹션·저장 종류마다 글리프 (틴트 동그라미 가운데)
export const SECTION_ICON: Record<Section, ComponentType<IconProps>> = {
  beauty: SparkleIcon,
  travel: PlaneIcon,
  clinic: SunIcon,
  drama: ClapperIcon,
};

const KIND_ICON: Record<CatalogKind, ComponentType<IconProps>> = {
  beauty: SparkleIcon,
  place: PlaneIcon,
  clinic: SunIcon,
  drama: ClapperIcon,
};

export function kindIcon(kind: SavedKind) {
  return kind === "article" ? BookIcon : KIND_ICON[kind];
}
