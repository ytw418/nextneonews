import Image from "next/image";

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

// 포토카드 한 장. 공식 이미지가 있으면 사진 + 제목, 없으면 메모 커버가 곧 제목이다
export function FeedCard({ item }: { item: FeedItem }) {
  const style = coverStyle(item.slug, item.category);
  return (
    <Link href={`/news/${item.slug}`} className="press-soft mb-3 block break-inside-avoid">
      <div className="overflow-hidden rounded-card bg-card shadow-card">
        {item.imageUrl ? (
          <div className={`relative ${style.ratio}`}>
            <Image src={item.imageUrl} alt="" fill unoptimized sizes="(max-width: 640px) 45vw, 300px" className="object-cover" />
          </div>
        ) : (
          <MemoCover
            title={item.title}
            sticker={item.categoryLabel}
            stamp={item.stamp}
            locale={item.locale}
            style={style}
          />
        )}
        {item.imageUrl && (
          <p className="title line-clamp-4 px-3 pt-3 text-t6 leading-row font-bold text-ink-900">
            <Phrase text={item.title} locale={item.locale} />
          </p>
        )}
        <p className="px-3 pt-1 pb-3 text-t7 text-ink-600">
          {item.imageUrl && (
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
