import Image from "next/image";

import type { FeedItem } from "@/components/FeedCard";
import { CATEGORY_ICON3D } from "@/data/icons3d";
import { coverStyle } from "@/lib/cover";

const SIZE = {
  48: "size-12",
  56: "size-14",
  64: "size-16",
} as const;


// 목록 줄 왼쪽의 작은 정사각 썸네일. 사진이 없으면 카테고리 틴트 + 카테고리 3D 아이콘 (빈 네모는 사진이 안 뜬 것처럼 보였다).
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
  const icon = CATEGORY_ICON3D[item.category as keyof typeof CATEGORY_ICON3D] ?? CATEGORY_ICON3D.LIFE;
  return (
    <span
      aria-hidden
      className={`relative grid place-items-center ${SIZE[size]} rounded-btn`}
      style={{ backgroundColor: coverStyle(item.slug, item.category).tint }}
    >
      <Image src={icon} unoptimized alt="" width={size * 0.6} height={size * 0.6} className="size-3/5" />
    </span>
  );
}
