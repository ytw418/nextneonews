import Image from "next/image";
import type { CSSProperties } from "react";

import { MemoCover } from "@/components/MemoCover";
import { type CreditMedia, PhotoCredit } from "@/components/PhotoCredit";
import { Phrase } from "@/components/Phrase";
import { Meta } from "@/components/ui/Meta";
import { Link } from "@/i18n/navigation";
import { coverStyle } from "@/lib/cover";

export interface FeedItem {
  slug: string;
  title: string;
  category: string;
  categoryLabel: string;
  timeAgo: string;
  locale: string;
  imageUrl?: string;
  credit?: CreditMedia; // 대표 사진 출처 (위키미디어면 저작자·라이선스·원본 링크)
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
  const href = `/news/${item.slug}`;

  if (!item.imageUrl) {
    // 메모 카드는 메모 한 장이 전부다: 도장 자리에 '3시간 전', 오른쪽 아래에 카테고리 배지.
    // 테이프가 카드 위로 삐져나오게 잘라 내지 않는다 (모서리는 메모가 직접 둥글린다)
    return (
      <Link href={href} className="press-soft block" style={style}>
        <MemoCover
          title={item.title}
          sticker={item.categoryLabel}
          stamp={item.timeAgo}
          locale={item.locale}
          style={cover}
          size={lead ? "lead" : "card"}
          className="rounded-card shadow-card"
        />
      </Link>
    );
  }

  const meta = (
    <p className={`pt-1 text-t7 text-ink-600 ${lead ? "px-4 pb-4" : "px-3 pb-3"}`}>
      <Meta
        parts={[showCategory && <span className="font-medium text-ink-700">{item.categoryLabel}</span>, item.timeAgo]}
      />
    </p>
  );

  if (lead) {
    // 맨 위 큰 사진에는 출처 표기(링크 둘)가 들어가서 카드 전체를 <a> 로 감쌀 수 없다.
    // 제목 링크를 카드 전체로 늘리고(after:inset-0), 출처 링크만 그 위로 올린다
    return (
      <div className="press-soft relative overflow-hidden rounded-card bg-card shadow-card" style={style}>
        <figure className="relative aspect-[4/3]">
          <Image
            src={item.imageUrl}
            alt=""
            fill
            unoptimized
            loading={priority ? "eager" : undefined}
            fetchPriority={priority ? "high" : undefined}
            sizes="(max-width: 640px) 100vw, 640px"
            className="object-cover object-[50%_20%]"
          />
          {item.credit && (
            <div className="absolute inset-x-0 bottom-0 z-10 bg-[linear-gradient(to_top,rgb(0_0_0/.6),transparent)] px-3 pt-6 pb-2">
              <PhotoCredit media={item.credit} className="" />
            </div>
          )}
        </figure>
        <p className="title px-4 pt-3 text-t4 font-bold text-ink-900">
          <Link href={href} className="after:absolute after:inset-0">
            <Phrase text={item.title} locale={item.locale} />
          </Link>
        </p>
        {meta}
      </div>
    );
  }

  return (
    <Link href={href} className="press-soft block" style={style}>
      <div className="overflow-hidden rounded-card bg-card shadow-card">
        <div className={`relative ${cover.ratio}`}>
          <Image
            src={item.imageUrl}
            alt=""
            fill
            unoptimized
            sizes="(max-width: 640px) 45vw, 300px"
            className="object-cover"
          />
        </div>
        {/* 4줄 자르기는 안전망. 파이프라인의 언어별 제목 길이 제한이 보통 4줄 안에 맞춘다 */}
        <p className="title line-clamp-4 px-3 pt-3 text-t6 leading-row font-bold text-ink-900">
          <Phrase text={item.title} locale={item.locale} />
        </p>
        {meta}
      </div>
    </Link>
  );
}
