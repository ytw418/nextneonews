"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";

import { PollCard } from "@/components/article/PollCard";
import { ReactionBar } from "@/components/article/ReactionBar";
import { ChevronRightIcon } from "@/components/icons";
import { PhotoCredit } from "@/components/PhotoCredit";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { categoryTint } from "@/lib/cover";
import type { AppendedArticleData } from "@/lib/engagement";
import { imgSrc } from "@/lib/image";

// 글 끝에 이어 붙인 다음 글 하나 (NextArticleLoader 가 /api/article 에서 받아 그린다).
// 문서의 h1 은 원래 글 하나뿐이라 제목은 h2 지만 모양은 h1 과 같다. JSON-LD 는 넣지 않는다 (원래 글 주소에만 있다).
// 출처·FAQ·댓글은 원래 글 주소에서 본다
export function AppendedArticle({ data, locale }: { data: AppendedArticleData; locale: string }) {
  const t = useTranslations("Engage");
  const tArticle = useTranslations("Article");
  const { id, hero } = data;
  const titleId = `title-${id}`;
  const longTitle = data.title.length > 70;
  const published = data.publishedAt ? new Date(data.publishedAt) : null;

  return (
    <article
      aria-labelledby={titleId}
      data-article-block={id}
      data-slug={data.slug}
      data-url={data.url}
      data-title={data.title}
    >
      <div aria-hidden className="mt-10 h-4 bg-band" />
      <p className="px-read pt-6 pb-3 text-t7 font-semibold text-ink-600">{t("nextLabel")}</p>

      {hero ? (
        <figure className="relative flex min-h-[min(125vw,800px,78svh)] w-full flex-col justify-end overflow-hidden">
          <Image
            src={imgSrc(hero.url, hero.width)}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, 640px"
            className="object-cover object-[50%_20%]"
          />
          <div className="relative bg-[linear-gradient(to_top,rgb(0_0_0/.72)_0%,rgb(0_0_0/.56)_calc(100%-96px),transparent_100%)] px-read pt-24 pb-6 text-white">
            <Badge tone="scrim">{data.categoryLabel}</Badge>
            <h2 id={titleId} data-article-title className={`title mt-2 font-bold text-white ${longTitle ? "text-t3" : "text-st2"}`}>
              {data.title}
            </h2>
            <PhotoCredit media={hero} />
          </div>
        </figure>
      ) : (
        // 사진이 없으면 카테고리 틴트 메모지 위에 제목
        <div className="px-gutter pt-2">
          <div
            className="tape relative rounded-card px-6 pt-12 pb-8 text-on-tint shadow-card"
            style={{ backgroundColor: categoryTint(data.category) }}
          >
            <h2 id={titleId} data-article-title className={`title memo-rules font-bold ${longTitle ? "text-t3" : "text-st2"}`}>
              {data.title}
            </h2>
            <Badge tone="paper" className="mt-4">
              {data.categoryLabel}
            </Badge>
          </div>
        </div>
      )}

      {published && (
        <p className="mt-5 px-read text-t7 tabular-nums text-ink-600">
          <time dateTime={data.publishedAt ?? undefined}>
            {new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "Asia/Seoul" }).format(published)}
          </time>
        </p>
      )}

      <p className="mt-3 px-read text-t5 font-medium text-ink-900">{data.summary}</p>

      {data.keyPoints.length > 0 && (
        <section
          aria-labelledby={`kp-${id}`}
          className="mx-read mt-6 rounded-card p-5 text-on-tint"
          style={{ backgroundColor: "var(--surface-note)" }}
        >
          <h3 id={`kp-${id}`} className="text-t4 font-bold">
            {tArticle("keyPoints")}
          </h3>
          <ol className="mt-3 space-y-2">
            {data.keyPoints.map((point, i) => (
              <li key={point} className="grid grid-cols-[20px_1fr] gap-2 text-t6">
                <span className="font-bold tabular-nums text-on-tint-sub">{i + 1}</span>
                {point}
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* 서버(lib/markdown.ts)가 raw HTML 을 이스케이프해서 만든 본문 */}
      <div
        className="article-body prose mt-8 max-w-none px-read dark:prose-invert"
        dangerouslySetInnerHTML={{ __html: data.bodyHtml }}
      />

      {data.poll && (
        <PollCard poll={data.poll} locale={locale} anchorId={`poll-${id}`} articleId={id} shareUrl={data.url} />
      )}
      <ReactionBar
        articleId={id}
        reactions={data.reactions}
        anchorId={`reactions-${id}`}
        commentHref={`${data.url}#comments`}
      />

      <div className="mt-8 px-read">
        <Button href={`/news/${data.slug}`} variant="neutral" size="l" block>
          {t("seeFull")}
          <ChevronRightIcon className="size-4" />
        </Button>
      </div>
    </article>
  );
}
