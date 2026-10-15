import Image from "next/image";

import type { FeedItem } from "@/components/FeedCard";
import { coverStyle } from "@/lib/cover";

const SIZE = {
  48: "size-12",
  56: "size-14",
  64: "size-16",
} as const;

// 목록 줄 왼쪽의 작은 정사각 썸네일. 사진이 없으면 메모 커버처럼 카테고리 틴트 + 작은 마스킹테이프.
// 제목이 바로 옆에 있어 그림은 읽지 않는다 (alt="", aria-hidden)
export function ArticleThumb({
  item,
  size = 56,
}: {
  item: Pick<FeedItem, "slug" | "category" | "imageUrl">;
  size?: keyof typeof SIZE;
}) {
  if (item.imageUrl) {
    return (
      <Image
        src={item.imageUrl}
        alt=""
        width={size}
        height={size}
        unoptimized
        className={`${SIZE[size]} rounded-btn object-cover`}
      />
    );
  }
  return (
    <span
      aria-hidden
      className={`relative block ${SIZE[size]} rounded-btn`}
      style={{ backgroundColor: coverStyle(item.slug, item.category).tint }}
    >
      <span className="absolute -top-1 left-1/2 h-2.5 w-6 -translate-x-1/2 -rotate-6 bg-(--tape) shadow-[0_1px_0_rgb(0_0_0/.04)]" />
    </span>
  );
}
