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
export function FeedCard({ item, index, featured }: { item: FeedItem; index: number; featured?: boolean }) {
  const style = coverStyle(item.slug, item.category);
  return (
    <Link
      href={`/news/${item.slug}`}
      className="rise mb-3 block break-inside-avoid active:scale-[0.98] transition-transform duration-150"
      style={{ ["--i" as string]: index }}
    >
      <div
        className={`overflow-hidden rounded-[18px] bg-card shadow-[0_1px_0_var(--line),0_6px_18px_-12px_rgba(27,21,32,0.25)] ${featured ? "holo" : ""}`}
      >
        {item.imageUrl ? (
          <div className={`relative ${style.ratio}`}>
            <Image src={item.imageUrl} alt={item.title} fill unoptimized sizes="50vw" className="object-cover" />
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
          <p className="title line-clamp-2 px-3 pt-2.5 text-[14px] font-bold leading-snug">
            <Phrase text={item.title} locale={item.locale} />
          </p>
        )}
        <p className="flex items-center gap-1.5 px-3 pb-3 pt-2 font-label text-[11px] text-muted">
          <span className="inline-block size-1.5 rounded-full bg-cherry" />
          {item.imageUrl ? `${item.categoryLabel} · ${item.timeAgo}` : item.timeAgo}
        </p>
      </div>
    </Link>
  );
}
