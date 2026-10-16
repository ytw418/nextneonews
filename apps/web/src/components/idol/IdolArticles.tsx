import { ArticleThumb } from "@/components/ArticleThumb";
import type { FeedItem } from "@/components/FeedCard";
import { Phrase } from "@/components/Phrase";
import { ListRow } from "@/components/ui/ListRow";
import { Meta } from "@/components/ui/Meta";
import { SectionHeader } from "@/components/ui/SectionHeader";

// 이 인물이 나오는 글 (최신순, 최대 10개). 줄마다 진짜 <a href> 라 검색·AI 수집기가 글로 따라간다
export function IdolArticles({ items, locale, title }: { items: FeedItem[]; locale: string; title: string }) {
  if (items.length === 0) return null;
  return (
    <section aria-labelledby="idol-news">
      <SectionHeader id="idol-news" title={title} />
      <ul>
        {items.map((item) => (
          <ListRow
            key={item.slug}
            href={`/news/${item.slug}`}
            titleWeight="semibold"
            left={<ArticleThumb item={item} size={56} />}
            title={<Phrase text={item.title} locale={locale} />}
            sub={
              <span className="text-t7">
                <Meta parts={[item.categoryLabel, item.timeAgo]} />
              </span>
            }
          />
        ))}
      </ul>
    </section>
  );
}
