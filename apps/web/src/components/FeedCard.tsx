import Image from "next/image";
import type { CSSProperties } from "react";

import { MemoCover } from "@/components/MemoCover";
import { Phrase } from "@/components/Phrase";
import { Link } from "@/i18n/navigation";
import { coverStyle } from "@/lib/cover";

export interface FeedItem {
  slug: string;
  title: string;
  category: string;
  categoryLabel: string;
  timeAgo: string;
  stamp: string;
  locale: string;
  imageUrl?: string;
}

interface Props {
  item: FeedItem;
  variant?: "lead" | "column";
  showCategory?: boolean; // 카테고리 페이지에서는 끈다 (선택된 칩이 이미 말한다)
  priority?: boolean; // 첫 화면에 보이는 맨 위 카드
  style?: CSSProperties;
}

// 포토카드 한 장. 공식 이미지가 있으면 사진 + 제목, 없으면 메모 커버가 곧 제목이다.
// lead 는 피드 맨 위 한 장(가로 꽉 차게), column 은 그 아래 두 열
export function FeedCard({ item, variant = "column", showCategory = true, priority, style }: Props) {
  const lead = variant === "lead";
  const cover = coverStyle(item.slug, item.category);
  const photo = Boolean(item.imageUrl);
  return (
    <Link href={`/news/${item.slug}`} className="press-soft block" style={style}>
      {/* 메모 카드는 테이프가 카드 위로 삐져나오게 잘라 내지 않는다 (모서리는 메모가 직접 둥글린다) */}
      <div className={`rounded-card bg-card shadow-card ${photo ? "overflow-hidden" : ""}`}>
        {item.imageUrl ? (
          <div className={`relative ${lead ? "aspect-[4/3]" : cover.ratio}`}>
            <Image
              src={item.imageUrl}
              alt=""
              fill
              unoptimized
              loading={priority ? "eager" : undefined}
              fetchPriority={priority ? "high" : undefined}
              sizes={lead ? "(max-width: 640px) 100vw, 640px" : "(max-width: 640px) 45vw, 300px"}
              className="object-cover"
            />
          </div>
        ) : (
          <MemoCover
            title={item.title}
            sticker={item.categoryLabel}
            stamp={item.stamp}
            locale={item.locale}
            style={cover}
            size={lead ? "lead" : "card"}
            className="rounded-t-card"
          />
        )}
        {photo &&
          (lead ? (
            <p className="title px-4 pt-3 text-t4 font-bold text-ink-900">
              <Phrase text={item.title} locale={item.locale} />
            </p>
          ) : (
            // 4줄 자르기는 안전망. 파이프라인의 언어별 제목 길이 제한이 보통 4줄 안에 맞춘다
            <p className="title line-clamp-4 px-3 pt-3 text-t6 leading-row font-bold text-ink-900">
              <Phrase text={item.title} locale={item.locale} />
            </p>
          ))}
        <p className={`text-t7 text-ink-600 ${lead ? "px-4 pb-4" : "px-3 pb-3"} ${photo ? "pt-1" : "pt-2"}`}>
          {/* 메모 커버는 카테고리 배지를 이미 달고 있다 */}
          {showCategory && photo && (
            <>
              <span className="font-medium text-ink-700">{item.categoryLabel}</span>
              {" · "}
            </>
          )}
          {item.timeAgo}
        </p>
      </div>
    </Link>
  );
}
