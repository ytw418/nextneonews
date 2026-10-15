import { getTranslations } from "next-intl/server";

import { ArticleThumb } from "@/components/ArticleThumb";
import { Phrase } from "@/components/Phrase";
import { ListRow } from "@/components/ui/ListRow";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { listPopular } from "@/lib/articles";
import { toFeedItems } from "@/lib/feed";

// 3개도 안 되면 순위표처럼 보이지 않아서 띄우지 않는다 (새 언어·조회가 아직 없을 때)
const MIN_ITEMS = 3;

// 홈의 '지금 인기' 5위까지. 음원 차트처럼 순위 숫자 + 작은 썸네일 + 제목 두 줄로 짧게
export async function TrendingNow({ locale }: { locale: string }) {
  const rows = await listPopular(locale, 5);
  if (rows.length < MIN_ITEMS) return null;
  const [t, items] = await Promise.all([getTranslations("Home"), toFeedItems(rows, locale)]);

  return (
    <section aria-labelledby="home-trending">
      <SectionHeader id="home-trending" title={t("trending")} />
      <ol>
        {items.map((item, i) => (
          <ListRow
            key={item.slug}
            href={`/news/${item.slug}`}
            titleWeight="semibold"
            left={
              <span className="flex items-center gap-3">
                {/* 1~3위는 진하게. 20px 굵은 숫자라 ink-400 도 3:1 을 넘는다 */}
                <span
                  className={`min-w-6 text-center text-t4 font-bold tabular-nums ${i < 3 ? "text-ink-900" : "text-ink-400"}`}
                >
                  {i + 1}
                </span>
                <ArticleThumb item={item} size={48} />
              </span>
            }
            title={
              <span className="line-clamp-2">
                <Phrase text={item.title} locale={locale} />
              </span>
            }
            sub={<span className="text-t7">{`${item.categoryLabel} · ${item.timeAgo}`}</span>}
          />
        ))}
      </ol>
    </section>
  );
}
