import { ArticleThumb } from "@/components/ArticleThumb";
import type { FeedItem } from "@/components/FeedCard";
import { Phrase } from "@/components/Phrase";
import { ListRow } from "@/components/ui/ListRow";
import { Meta } from "@/components/ui/Meta";
import { SectionHeader } from "@/components/ui/SectionHeader";

// 3개도 안 되면 순위표처럼 보이지 않아서 띄우지 않는다 (새 언어·조회가 아직 없을 때)
export const RANKED_MIN = 3;

// 글자를 키워(약 120% 이상·사파리 aA 135%·AX) 목록 폭이 20rem 보다 좁아지면 썸네일을 빼고 제목을 세 줄까지.
// 순위 숫자 + 56px 썸네일이 남으면 제목이 세 단어쯤에서 잘렸다. 기본 크기에서는 360px 폭(21rem)도 그대로다
export const THUMB_LARGE_TEXT = "@max-[20rem]:hidden";

interface Props {
  id: string;
  title: string;
  items: FeedItem[];
  locale: string;
  inset?: "gutter" | "read"; // 홈은 gutter, 글 끝은 읽기 열(read)
}

// 인기 글 순위표. 음원 차트처럼 순위 숫자 + 작은 썸네일 + 제목 두 줄로 짧게.
// 홈 '지금 인기'와 글 끝 '이번 주 인기 글'이 같은 모양을 쓴다
export function RankedArticles({ id, title, items, locale, inset = "gutter" }: Props) {
  if (items.length < RANKED_MIN) return null;
  return (
    <section aria-labelledby={id} className="@container">
      <SectionHeader id={id} title={title} inset={inset} />
      <ol>
        {items.map((item, i) => (
          <ListRow
            key={item.slug}
            href={`/news/${item.slug}`}
            inset={inset}
            titleWeight="semibold"
            left={
              <span className="flex items-center gap-3">
                {/* 1~3위는 진하게. 20px 굵은 숫자라 ink-400 도 3:1 을 넘는다 */}
                <span
                  className={`min-w-6 text-center text-t4 font-bold tabular-nums ${i < 3 ? "text-ink-900" : "text-ink-400"}`}
                >
                  {i + 1}
                </span>
                <span className={THUMB_LARGE_TEXT}>
                  <ArticleThumb item={item} size={48} />
                </span>
              </span>
            }
            title={
              <span className="line-clamp-2 @max-[20rem]:line-clamp-3">
                <Phrase text={item.title} locale={locale} />
              </span>
            }
            sub={
              <span className="text-t7">
                <Meta parts={[item.categoryLabel, item.timeAgo]} />
              </span>
            }
          />
        ))}
      </ol>
    </section>
  );
}
