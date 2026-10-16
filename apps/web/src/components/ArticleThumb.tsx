import Image from "next/image";

import type { FeedItem } from "@/components/FeedCard";
import {
  BookIcon,
  BowlIcon,
  BriefcaseIcon,
  ClapperIcon,
  HeartIcon,
  HomeIcon,
  MicIcon,
  PlaneIcon,
  SparkleIcon,
  StarIcon,
  SunIcon,
} from "@/components/icons";
import { coverStyle } from "@/lib/cover";

const SIZE = {
  48: "size-12",
  56: "size-14",
  64: "size-16",
} as const;

// 사진 없는 썸네일 가운데 카테고리 글리프 (빈 네모는 사진이 안 뜬 것처럼 보였다)
const GLYPH: Record<string, typeof MicIcon> = {
  KPOP: MicIcon,
  KENT: StarIcon,
  KDRAMA: ClapperIcon,
  KFOOD: BowlIcon,
  KBEAUTY: SparkleIcon,
  TRAVEL: PlaneIcon,
  WORKING_HOLIDAY: PlaneIcon,
  STUDY: BookIcon,
  LOVE: HeartIcon,
  JOBS: BriefcaseIcon,
  HOUSING: HomeIcon,
  LIFE: SunIcon,
};

// 목록 줄 왼쪽의 작은 정사각 썸네일. 사진이 없으면 메모 커버처럼 카테고리 틴트 + 작은 마스킹테이프 + 카테고리 글리프.
// 제목이 바로 옆에 있어 그림은 읽지 않는다 (alt="", aria-hidden)
export function ArticleThumb({
  item,
  size = 56,
}: {
  item: Pick<FeedItem, "slug" | "category" | "imageUrl">;
  size?: keyof typeof SIZE;
}) {
  if (item.imageUrl) {
    // 크기가 고정이라 sizes 를 주지 않는다: srcset 이 1x·2x 만 생겨 48·56px 은 120px 썸네일 한 장을 받는다
    // (sizes 를 주면 전체 폭 목록이 붙어 아이폰 3x 화면이 250px PNG(~100KB)를 고른다). 위키미디어 표준 폭은 lib/image.ts
    return (
      <Image
        src={item.imageUrl}
        alt=""
        width={size}
        height={size}
        className={`${SIZE[size]} rounded-btn object-cover object-[50%_20%]`}
      />
    );
  }
  const Glyph = GLYPH[item.category] ?? SparkleIcon;
  return (
    <span
      aria-hidden
      className={`relative grid place-items-center ${SIZE[size]} rounded-btn`}
      style={{ backgroundColor: coverStyle(item.slug, item.category).tint }}
    >
      <span className="absolute -top-1 left-1/2 h-2.5 w-6 -translate-x-1/2 -rotate-6 bg-(--tape) shadow-[0_1px_0_rgb(0_0_0/.04)]" />
      <Glyph className="size-6 text-on-tint-sub" />
    </span>
  );
}
