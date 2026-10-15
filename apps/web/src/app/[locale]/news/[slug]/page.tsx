import { faqNotInBody, findEventForArticle, isLocale, readMinutes } from "@kmedia/core";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import ReactMarkdown from "react-markdown";

import { AdSlot } from "@/components/AdSlot";
import { AppHeader } from "@/components/AppHeader";
import { ArticleThumb } from "@/components/ArticleThumb";
import { RelatedEventCard } from "@/components/article/RelatedEventCard";
import { Comments } from "@/components/Comments";
import { ChevronDownIcon } from "@/components/icons";
import { JsonLd } from "@/components/JsonLd";
import { MemoCover } from "@/components/MemoCover";
import { PhotoCredit } from "@/components/PhotoCredit";
import { Phrase } from "@/components/Phrase";
import { RANKED_MIN, RankedArticles } from "@/components/RankedArticles";
import { ShareButton } from "@/components/ShareButton";
import { Badge } from "@/components/ui/Badge";
import { ListRow } from "@/components/ui/ListRow";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ViewPing } from "@/components/ViewPing";
import { entityNames, findTranslatedLocale, getArticle, listPopular, listRelated } from "@/lib/articles";
import { coverStyle } from "@/lib/cover";
import { toFeedItems } from "@/lib/feed";
import { articleJsonLd } from "@/lib/jsonld";
import { dateStamp } from "@/lib/time";
import { articlePath, localeHomePath, ogBase, SITE_URL } from "@/lib/url";

export const revalidate = 300;

// 글 페이지는 빌드 때 만들지 않고 첫 요청 때 만든 뒤 캐시한다.
export function generateStaticParams() {
  return [];
}

interface Faq {
  q: string;
  a: string;
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export async function generateMetadata({ params }: PageProps<"/[locale]/news/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  const translation = await getArticle(locale, slug);
  if (!translation) {
    return {};
  }

  const languages: Record<string, string> = Object.fromEntries(
    translation.article.translations.map((t) => [t.locale, articlePath(t.locale, t.slug)]),
  );
  if (languages.en) {
    languages["x-default"] = languages.en;
  }

  const description = translation.seoDesc ?? translation.summary;
  const image = translation.article.media[0]?.url;
  const title = translation.seoTitle ?? translation.title;
  const canonical = articlePath(locale, slug);
  return {
    // 긴 제목은 사이트명을 붙이지 않는다 (검색 결과에서 잘리지 않게)
    title: title.length > 45 ? { absolute: title } : title,
    description,
    alternates: { canonical, languages },
    robots: translation.indexable ? undefined : { index: false },
    openGraph: {
      ...ogBase(locale),
      type: "article",
      url: canonical,
      title: translation.title,
      description,
      publishedTime: translation.article.publishedAt?.toISOString(),
      modifiedTime: translation.article.updatedAt.toISOString(),
      images: [image ?? `${localeHomePath(locale)}/opengraph-image`],
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function ArticlePage({ params }: PageProps<"/[locale]/news/[slug]">) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const translation = await getArticle(locale, slug);
  if (!translation) {
    // 이 언어 번역이 아직 없으면(배치 번역 대기 등) 있는 언어로 잠시 보낸다
    const other = await findTranslatedLocale(slug);
    if (other && other !== locale) redirect(articlePath(other, slug));
    notFound();
  }
  const { article } = translation;
  const [t, tCat, relatedRows, popularRows] = await Promise.all([
    getTranslations("Article"),
    getTranslations("Category"),
    listRelated(locale, article, 4),
    listPopular(locale, 12),
  ]);
  // 이번 주 인기 글에서는 이 글과 '함께 읽기'에 이미 나온 글을 뺀다
  const shown = new Set([slug, ...relatedRows.map((r) => r.slug)]);
  const [related, popularItems] = await Promise.all([
    toFeedItems(relatedRows, locale),
    toFeedItems(popularRows.filter((r) => !shown.has(r.slug)).slice(0, 5), locale),
  ]);
  const popular = popularItems.length >= RANKED_MIN ? popularItems : [];

  const keyPoints = asArray<string>(translation.keyPoints);
  // 본문 소제목을 되풀이하는 질문은 화면과 JSON-LD 둘 다에서 뺀다
  const faq = faqNotInBody(asArray<Faq>(translation.faq), translation.body);
  const hero = article.media[0];
  const categoryLabel = tCat(article.category);
  const url = `${SITE_URL}${articlePath(locale, slug)}`;
  // 글에 나오는 다가오는 일정 (컴백·시상식 등). 있으면 요약 밑에 카드 한 줄
  const event = findEventForArticle({
    title: translation.title,
    entityNames: entityNames(article.entities),
    publishedAt: article.publishedAt,
  });

  const published = article.publishedAt;
  // 정정 요청 메일 주소는 설정했을 때만 (주소를 코드에 박지 않는다)
  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL;

  return (
    <>
      <AppHeader
        variant="pushed"
        parentHref="/"
        title={translation.title}
        action={<ShareButton title={translation.title} label={t("share")} copiedLabel={t("copied")} />}
      />

      <article>
        <JsonLd
          data={articleJsonLd({
            url,
            locale,
            title: translation.title,
            description: translation.seoDesc ?? translation.summary,
            category: article.category,
            publishedAt: article.publishedAt,
            updatedAt: article.updatedAt,
            faq,
            entities: asArray(article.entities),
            sourceUrls: article.sources.map((s) => s.url),
            image: hero?.url,
            homeUrl: `${SITE_URL}${localeHomePath(locale)}`,
          })}
        />

        {hero ? (
          // 공식 이미지가 있으면 화면을 꽉 채우는 매거진 커버. 제목 블록이 흐름 안에 있어 긴 제목이면 커버가 늘어난다
          <figure className="relative flex min-h-[min(125vw,800px,78svh)] w-full flex-col justify-end overflow-hidden">
            <Image
              src={hero.url}
              alt=""
              fill
              unoptimized
              priority
              sizes="(max-width: 640px) 100vw, 640px"
              className="object-cover"
            />
            <div className="relative bg-[linear-gradient(to_top,rgb(0_0_0/.72)_0%,rgb(0_0_0/.56)_calc(100%-96px),transparent_100%)] px-read pt-24 pb-6 text-white">
              <Badge tone="scrim">{categoryLabel}</Badge>
              <h1 className="title mt-2 text-st2 font-bold text-white">
                <Phrase text={translation.title} locale={locale} />
              </h1>
              <PhotoCredit media={hero} />
            </div>
          </figure>
        ) : (
          // 사진이 없으면 파스텔 메모 커버가 곧 제목
          <div className="px-gutter pt-4">
            <div className="overflow-hidden rounded-card shadow-card">
              <MemoCover
                title={translation.title}
                sticker={categoryLabel}
                stamp={dateStamp(article.publishedAt)}
                locale={locale}
                style={coverStyle(slug, article.category)}
                size="hero"
                as="h1"
              />
            </div>
          </div>
        )}

        {/* 날짜 · 읽는 시간. '업데이트'는 띄우지 않는다 (article.updatedAt 은 본문을 고친 시각이 아니다) */}
        <p className="mt-5 px-read text-t7 tabular-nums text-ink-600">
          {published && (
            <>
              <time dateTime={published.toISOString()}>
                {new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "Asia/Seoul" }).format(published)}
              </time>
              {" · "}
            </>
          )}
          {t("readTime", { minutes: readMinutes(translation.body) })}
        </p>

        <p className="mt-3 px-read text-t5 font-medium text-ink-900">{translation.summary}</p>

        {event && isLocale(locale) && <RelatedEventCard e={event} locale={locale} />}

        {keyPoints.length > 0 && (
          <section
            aria-labelledby="kp"
            className="mx-read mt-6 rounded-card p-5 text-on-tint"
            style={{ backgroundColor: "var(--surface-note)" }}
          >
            <h2 id="kp" className="text-t4 font-bold">
              {t("keyPoints")}
            </h2>
            <ol className="mt-3 space-y-2">
              {keyPoints.map((point, i) => (
                <li key={point} className="grid grid-cols-[20px_1fr] gap-2 text-t6">
                  <span className="font-bold tabular-nums text-on-tint-sub">{i + 1}</span>
                  {point}
                </li>
              ))}
            </ol>
          </section>
        )}

        <div className="article-body prose mt-8 max-w-none px-read dark:prose-invert">
          <ReactMarkdown>{translation.body}</ReactMarkdown>
        </div>

        {faq.length > 0 && (
          <section className="mt-10">
            <SectionHeader inset="read" title={t("faq")} />
            <div className="mx-read divide-y divide-line border-y border-line">
              {faq.map((item, i) => (
                <details key={item.q} className="faq group" open={i === 0}>
                  <summary className="flex min-h-14 cursor-pointer items-start gap-2 py-4 text-t5 font-semibold text-ink-900">
                    <span aria-hidden className="w-6 shrink-0 font-bold text-ink-400">
                      Q
                    </span>
                    <span className="flex-1">{item.q}</span>
                    <ChevronDownIcon className="mt-0.5 size-5 shrink-0 text-ink-400 transition-transform duration-200 ease-expo group-open:rotate-180" />
                  </summary>
                  <p className="pb-4 pl-8 text-t6 text-ink-700">{item.a}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        {article.sources.length > 0 && (
          <section className="mt-10">
            <SectionHeader inset="read" title={t("sources")} />
            <ul>
              {article.sources.map((source) => (
                <ListRow
                  key={source.id}
                  external
                  href={source.url}
                  inset="read"
                  titleWeight="medium"
                  title={source.publisher}
                  sub={hostname(source.url)}
                />
              ))}
            </ul>
          </section>
        )}

        {/* AI 고지는 사실대로: 공식 발표·한국 언론을 바탕으로 AI 로 쓰고 번역했다 (편집자 검토 문구는 넣지 않는다) */}
        <p className="mt-4 px-read text-t7 text-ink-600">{t("aiNotice")}</p>
        {contactEmail && (
          <a
            href={`mailto:${contactEmail}?subject=${encodeURIComponent(translation.title)}&body=${encodeURIComponent(url)}`}
            className="mx-read inline-flex min-h-11 items-center text-t7 font-semibold text-ink-700 underline underline-offset-4"
          >
            {t("correction")}
          </a>
        )}

        <AdSlot label={t("ad")} />

        <div aria-hidden className="mt-10 h-4 bg-band" />
        <Comments articleId={article.id} />
        <ViewPing articleId={article.id} />

        {/* 글 끝: 함께 읽기(같은 인물·카테고리) → 이번 주 인기 글. 섹션 제목은 같은 모양 하나 */}
        {(related.length > 0 || popular.length > 0) && (
          <>
            <div aria-hidden className="mt-10 h-4 bg-band" />
            {related.length > 0 && (
              <section aria-labelledby="related">
                <SectionHeader id="related" inset="read" title={t("related")} />
                <ul>
                  {related.map((item) => (
                    <ListRow
                      key={item.slug}
                      href={`/news/${item.slug}`}
                      inset="read"
                      titleWeight="semibold"
                      left={<ArticleThumb item={item} size={64} />}
                      title={<Phrase text={item.title} locale={locale} />}
                      sub={<span className="text-t7">{`${item.categoryLabel} · ${item.timeAgo}`}</span>}
                    />
                  ))}
                </ul>
              </section>
            )}
            <RankedArticles id="popular" title={t("popular")} items={popular} locale={locale} inset="read" />
          </>
        )}
      </article>
    </>
  );
}
