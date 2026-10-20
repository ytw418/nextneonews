import Image from "next/image";
import type { ReactNode } from "react";

import { PhotoCredit } from "@/components/PhotoCredit";
import { Badge } from "@/components/ui/Badge";
import { icon3dSrc } from "@/data/icons3d";
import type { CoverSpec } from "@/data/types";
import { imgSrc } from "@/lib/image";

export type TypeCoverVariant = "grid" | "square" | "hero" | "tile";

export interface CoverArtProps {
  cover: CoverSpec; // 3D 아이콘 또는 CC 사진 (data/cover.ts)
  tint?: string; // 아이콘 커버의 면. 기본 회색 (--band)
  variant?: TypeCoverVariant;
  label?: string; // 왼쪽 위 작은 배지 (분류)
  title?: ReactNode; // grid·tile 만. hero 는 제목을 커버 밖 h1 로 둔다
  sub?: string;
  isNew?: boolean;
  newLabel?: string;
  rank?: number; // 왼쪽 위 순위 배지 (어워드·오늘 화제). label 과 같은 자리라 둘 중 하나만
  alt?: string; // 사진의 대체 글. 커버 안에 제목이 있으면 비운다 (기본)
  textClassName?: string; // 제목 칸 좌우 자리. 낮은 타일(2:1)은 오른쪽 아이콘을 비켜 준다
  credit?: boolean; // 사진 저작자 표기. 사진을 크게 보이는 상세 히어로만 (카드는 표기가 있는 상세로 가는 링크다)
  priority?: boolean; // 상세 히어로 사진(LCP)
  className?: string;
  children?: ReactNode; // 히어로 제목·하트 받침처럼 커버 위에 올리는 것
}

// 사진을 쓸 수 없는 가이드 항목(제품·시술·드라마)과 매장의 커버. 면은 회색, 색은 3D 아이콘이 낸다 (홈 GuideHero 와 같은 문법:
// 아이콘은 오른쪽 위, 글은 왼쪽 아래). CC 사진이 있는 명소·동네는 사진을 깔고 글 밑에 그늘을 둔다.
// 서버 화면은 TypeCover(제목 줄바꿈)를 쓰고, 클라이언트 화면(저장함)은 이걸 바로 쓴다 — Phrase(budoux 사전)를 브라우저 번들에 싣지 않으려고.
// 상세 히어로는 5:2(아이폰 15에서 156px): 4:3 은 첫 화면 44%가 커버라 제목·첫 행동이 탭바 밑으로 밀렸다
const RATIO: Record<TypeCoverVariant, string> = {
  grid: "aspect-[3/4] rounded-card",
  square: "aspect-square rounded-btn-m",
  hero: "aspect-[5/2]",
  tile: "aspect-[5/4] rounded-card",
};

// 아이콘 자리·크기. grid 는 위 줄(라벨·NEW·순위) 아래 오른쪽, 히어로는 오른쪽 가운데 (왼쪽 아래 제목과 겹치지 않게)
const ICON: Record<TypeCoverVariant, { box: string; px: number }> = {
  grid: { box: "top-11 right-3 size-16", px: 64 },
  tile: { box: "top-2.5 right-2.5 size-12", px: 48 },
  hero: { box: "top-1/2 right-6 size-24 -translate-y-1/2", px: 96 },
  square: { box: "inset-[18%]", px: 40 },
};

// 사진 폭 후보 (커스텀 로더가 위키미디어 표준 폭으로 고른다)
const SIZES: Record<TypeCoverVariant, string> = {
  grid: "(max-width: 640px) 45vw, 300px",
  tile: "(max-width: 640px) 50vw, 320px",
  hero: "(max-width: 640px) 100vw, 640px",
  square: "64px",
};

export function CoverArt({
  cover,
  tint = "var(--band)",
  variant = "grid",
  label,
  title,
  sub,
  isNew = false,
  newLabel = "NEW",
  rank,
  alt = "",
  textClassName = "inset-x-3",
  credit = false,
  priority = false,
  className = "",
  children,
}: CoverArtProps) {
  const photo = cover.kind === "photo" ? cover.photo : null;
  const showText = (variant === "grid" || variant === "tile") && (title || sub);
  // 사진 위 글자는 흰색 + 아래 그늘. 아이콘 커버는 회색 면 위 진한 글자
  const scrim = photo && (showText || (variant === "hero" && (children || credit)));
  return (
    <div
      className={`relative overflow-hidden ${photo ? "bg-fill-weak text-white" : "text-on-tint"} ${RATIO[variant]} ${className}`}
      style={photo ? undefined : { backgroundColor: tint }}
    >
      {cover.kind === "photo" ? (
        <Image
          src={imgSrc(cover.photo.url, cover.photo.width)}
          alt={alt}
          fill
          sizes={SIZES[variant]}
          {...(priority ? { loading: "eager" as const, fetchPriority: "high" as const } : {})}
          className="object-cover"
        />
      ) : (
        <Image
          src={icon3dSrc(cover.icon)}
          unoptimized
          alt=""
          width={ICON[variant].px}
          height={ICON[variant].px}
          className={`pointer-events-none absolute select-none drop-shadow-md ${ICON[variant].box}`}
        />
      )}
      {scrim && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 bg-[linear-gradient(to_top,rgb(0_0_0/.62),transparent)]"
        />
      )}
      {rank !== undefined && variant !== "square" && (
        <span className="absolute top-2.5 left-2.5 grid size-7 place-items-center rounded-full bg-ink-900 text-t6 font-bold text-white tabular-nums shadow-float">
          {rank}
        </span>
      )}
      {label && rank === undefined && variant !== "square" && (
        // NEW 스티커가 있으면 오른쪽 자리를 비워 둔다 (긴 라벨이 스티커 밑으로 들어갔다)
        <Badge
          tone={photo ? "scrim" : "paper"}
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
      {showText && (
        <div className={`absolute bottom-3 ${textClassName}`}>
          {/* 타일도 두 줄까지: ru·fr·vi 섹션 이름이 한 줄에 안 들어가 말줄임표로 잘렸다 */}
          {/* 띄어쓰기 없는 긴 이름(KWANGYA@Seoul)도 칸 안에서 끊는다 */}
          {title && <p className="title line-clamp-2 text-t5 font-bold leading-row break-words">{title}</p>}
          {sub && (
            <p className={`mt-0.5 truncate text-st12 font-semibold ${photo ? "text-white/80" : "text-on-tint-sub"}`}>
              {sub}
            </p>
          )}
        </div>
      )}
      {children}
      {credit && photo && (
        <PhotoCredit media={{ credit: null, ...photo }} className="absolute right-3 bottom-1.5 left-3 truncate" />
      )}
    </div>
  );
}
