import { getTranslations } from "next-intl/server";

import { TimeAgo } from "@/components/article/TimeAgo";
import { RANKED_MIN } from "@/components/RankedArticles";
import { ListRow } from "@/components/ui/ListRow";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { listRecentComments } from "@/lib/comments";

// 홈 '방금 달린 댓글': 다른 사람이 지금 무슨 말을 하는지 보여 주고 그 글의 댓글 칸으로 바로 보낸다.
// 3개가 안 되면 빈 동네처럼 보여서 띄우지 않는다
export async function RecentComments({ locale }: { locale: string }) {
  const [t, comments] = await Promise.all([getTranslations("Home"), listRecentComments(locale)]);
  if (comments.length < RANKED_MIN) return null;
  return (
    <section aria-labelledby="home-comments">
      <SectionHeader id="home-comments" title={t("recentComments")} />
      <ul>
        {comments.map((c) => (
          <ListRow
            key={c.id}
            href={`/news/${c.slug}#comments`}
            titleWeight="medium"
            alignTop
            title={<span className="line-clamp-2">“{c.body}”</span>}
            sub={
              <span className="flex flex-col gap-0.5 text-t7">
                <span className="line-clamp-1 text-ink-600">{c.title}</span>
                <span className="text-ink-400">
                  {c.nickname} · <TimeAgo iso={c.createdAt} locale={locale} />
                </span>
              </span>
            }
          />
        ))}
      </ul>
    </section>
  );
}
