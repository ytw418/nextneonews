import type { ReactNode } from "react";
import { Phrase } from "@/components/Phrase";
import { Badge } from "@/components/ui/Badge";

export type TypeCoverVariant = "grid" | "square" | "hero" | "tile";

interface Props {
  tint: string; // 섹션 틴트 변수, 예: "var(--tint-kbeauty)"
  glyph: string; // 유령 글자: 브랜드 이니셜·동네 한 글자·회복 일수·회차 (docs/monetize/DESIGN.md §4-①)
  variant?: TypeCoverVariant;
  label?: string; // 왼쪽 위 작은 배지 (분류)
  title?: string; // grid·tile 만. hero 는 제목을 커버 밖 h1 로 둔다
  sub?: string;
  locale?: string; // 제목 CJK 줄바꿈
  isNew?: boolean;
  newLabel?: string;
  className?: string;
  children?: ReactNode; // 하트 받침·순위 숫자처럼 커버 위에 올리는 것
}

// 사진 없는 제품·명소·시술·드라마 커버: 틴트 면 + 오른쪽 아래 밖으로 잘린 큰 글자 + 작은 라벨.
// 유령 글자가 통째로 보이면 '아이콘 카드' 가 되므로 늘 잘리게 둔다. 장식이라 화면 읽기에서 뺀다
const RATIO: Record<TypeCoverVariant, string> = {
  grid: "aspect-[3/4] rounded-card",
  square: "aspect-square rounded-btn-m",
  hero: "aspect-[4/3]",
  tile: "aspect-[5/4] rounded-card",
};
const GHOST: Record<TypeCoverVariant, string> = {
  grid: "-right-3 -bottom-5 text-poster",
  square: "-right-1.5 -bottom-2.5 text-display",
  hero: "-right-4 -bottom-8 text-poster",
  tile: "-right-3 -bottom-5 text-poster",
};

export function TypeCover({
  tint,
  glyph,
  variant = "grid",
  label,
  title,
  sub,
  locale = "en",
  isNew = false,
  newLabel = "NEW",
  className = "",
  children,
}: Props) {
  const showText = variant === "grid" || variant === "tile";
  return (
    <div
      className={`relative overflow-hidden text-on-tint ${RATIO[variant]} ${className}`}
      style={{ backgroundColor: tint }}
    >
      <span
        aria-hidden
        className={`pointer-events-none absolute select-none font-bold leading-none tracking-tighter tabular-nums whitespace-nowrap text-on-tint-ghost ${GHOST[variant]}`}
      >
        {glyph}
      </span>
      {label && variant !== "square" && (
        <Badge tone="paper" className="absolute top-2.5 left-2.5">
          {label}
        </Badge>
      )}
      {isNew && variant !== "square" && (
        <Badge tone="brand" className="absolute top-2 right-2 -rotate-6 shadow-float">
          {newLabel}
        </Badge>
      )}
      {showText && (title || sub) && (
        <div className="absolute inset-x-3 bottom-3">
          {title && (
            <p
              className={`title font-bold leading-row ${variant === "tile" ? "line-clamp-1 text-t5" : "line-clamp-2 text-t5"}`}
            >
              <Phrase text={title} locale={locale} />
            </p>
          )}
          {sub && <p className="mt-0.5 truncate text-st12 font-semibold text-on-tint-sub">{sub}</p>}
        </div>
      )}
      {children}
    </div>
  );
}
