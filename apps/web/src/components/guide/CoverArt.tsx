import type { ReactNode } from "react";

import { Badge } from "@/components/ui/Badge";

export type TypeCoverVariant = "grid" | "square" | "hero" | "tile";

export interface CoverArtProps {
  tint: string; // 섹션 틴트 변수, 예: "var(--tint-kbeauty)"
  glyph: string; // 유령 글자: 브랜드 이니셜·동네 한 글자·회복 일수·회차 (docs/monetize/DESIGN.md §4-①)
  variant?: TypeCoverVariant;
  label?: string; // 왼쪽 위 작은 배지 (분류)
  title?: ReactNode; // grid·tile 만. hero 는 제목을 커버 밖 h1 로 둔다
  sub?: string;
  isNew?: boolean;
  newLabel?: string;
  className?: string;
  children?: ReactNode; // 하트 받침·순위 숫자처럼 커버 위에 올리는 것
}

// 사진 없는 커버의 뼈대 (줄바꿈 처리 없는 제목). 서버 화면은 TypeCover 를 쓰고,
// 클라이언트 화면(저장함)은 이걸 바로 쓴다 — TypeCover 의 Phrase(budoux 사전)를 브라우저 번들에 싣지 않으려고
const RATIO: Record<TypeCoverVariant, string> = {
  grid: "aspect-[3/4] rounded-card",
  square: "aspect-square rounded-btn-m",
  hero: "aspect-[4/3]",
  tile: "aspect-[5/4] rounded-card",
};

// 유령 글자는 늘 오른쪽 아래 밖으로 잘린다 (통째로 보이면 '아이콘 카드'가 된다).
// 56px 정사각 썸네일에서는 10% 유령 글자가 거의 안 보여 사진이 안 뜬 빈 칸처럼 보였다 → 정사각만 부제 잉크로 진하게
const GHOST: Record<TypeCoverVariant, string> = {
  grid: "-right-3 -bottom-5 text-poster text-on-tint-ghost",
  square: "-right-1 -bottom-2 text-display text-on-tint-sub",
  hero: "-right-4 -bottom-8 text-poster text-on-tint-ghost",
  tile: "-right-3 -bottom-5 text-poster text-on-tint-ghost",
};

export function CoverArt({
  tint,
  glyph,
  variant = "grid",
  label,
  title,
  sub,
  isNew = false,
  newLabel = "NEW",
  className = "",
  children,
}: CoverArtProps) {
  const showText = variant === "grid" || variant === "tile";
  return (
    <div
      className={`relative overflow-hidden text-on-tint ${RATIO[variant]} ${className}`}
      style={{ backgroundColor: tint }}
    >
      <span
        aria-hidden
        className={`pointer-events-none absolute select-none font-bold leading-none tracking-tighter tabular-nums whitespace-nowrap ${GHOST[variant]}`}
      >
        {glyph}
      </span>
      {label && variant !== "square" && (
        // NEW 스티커가 있으면 오른쪽 자리를 비워 둔다 (긴 라벨이 스티커 밑으로 들어갔다)
        <Badge
          tone="paper"
          className={`absolute top-2.5 left-2.5 ${isNew ? "max-w-[calc(100%-4.75rem)]" : "max-w-[calc(100%-1.25rem)]"}`}
        >
          <span className="min-w-0 truncate">{label}</span>
        </Badge>
      )}
      {isNew && variant !== "square" && (
        <Badge tone="brand" className="absolute top-2 right-2 -rotate-6 shadow-float">
          {newLabel}
        </Badge>
      )}
      {showText && (title || sub) && (
        <div className="absolute inset-x-3 bottom-3">
          {/* 타일도 두 줄까지: ru·fr·vi 섹션 이름이 한 줄에 안 들어가 말줄임표로 잘렸다 */}
          {/* 띄어쓰기 없는 긴 이름(KWANGYA@Seoul)도 칸 안에서 끊는다 */}
          {title && <p className="title line-clamp-2 text-t5 font-bold leading-row break-words">{title}</p>}
          {sub && <p className="mt-0.5 truncate text-st12 font-semibold text-on-tint-sub">{sub}</p>}
        </div>
      )}
      {children}
    </div>
  );
}
