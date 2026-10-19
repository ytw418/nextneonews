import Image from "next/image";

import { type FeedItem, itemTime } from "@/components/FeedCard";
import { MemoCover } from "@/components/MemoCover";
import { PhotoCredit } from "@/components/PhotoCredit";
import { Phrase } from "@/components/Phrase";
import { Badge } from "@/components/ui/Badge";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Link } from "@/i18n/navigation";
import { coverStyle } from "@/lib/cover";

// 글 끝 '다음 글' 큰 카드 하나. 진짜 <a href> 라서 크롤러도 이 길로 다음 글에 간다.
// 사진이 있으면 16:9 사진 + 카테고리 배지 + 제목 두 줄, 없으면 메모 커버가 곧 제목이다
export function UpNextCard({ item, title }: { item: FeedItem; title: string }) {
  const href = `/news/${item.slug}`;
  return (
    <section id="up-next" aria-labelledby="up-next-title" className="mt-6 scroll-mt-20">
      <SectionHeader id="up-next-title" inset="read" title={title} />
      <div className="px-read">
        {item.imageUrl ? (
          // 사진 출처(링크 둘)가 들어가서 카드 전체를 <a> 로 감쌀 수 없다. 제목 링크를 카드 전체로 늘린다 (FeedCard lead 와 같은 방식)
          <div className="press-soft relative overflow-hidden rounded-card bg-card shadow-card">
            <figure className="relative aspect-video">
              <Image
                src={item.imageUrl}
                alt=""
                fill
                sizes="(max-width: 640px) 100vw, 592px"
                className="object-cover object-[50%_20%]"
              />
              {item.credit && (
                <div className="absolute inset-x-0 bottom-0 z-10 bg-[linear-gradient(to_top,rgb(0_0_0/.6),transparent)] px-3 pt-6 pb-2">
                  <PhotoCredit media={item.credit} className="" />
                </div>
              )}
            </figure>
            <div className="p-4">
              <Badge tone="brandWeak">{item.categoryLabel}</Badge>
              <p className="title mt-2 line-clamp-2 text-t4 font-bold text-ink-900">
                <Link href={href} className="after:absolute after:inset-0">
                  <Phrase text={item.title} locale={item.locale} />
                </Link>
              </p>
            </div>
          </div>
        ) : (
          <Link href={href} className="press-soft block">
            <MemoCover
              title={<Phrase text={item.title} locale={item.locale} />}
              sticker={item.categoryLabel}
              stamp={itemTime(item)}
              style={coverStyle(item.slug, item.category)}
              size="lead"
              className="rounded-card shadow-card"
            />
          </Link>
        )}
      </div>
    </section>
  );
}
