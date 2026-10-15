import type { Metadata } from "next";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import ReactMarkdown from "react-markdown";

import { AdSlot } from "@/components/AdSlot";
import { AppHeader } from "@/components/AppHeader";
import { Comments } from "@/components/Comments";
import { FeedCard } from "@/components/FeedCard";
import { JsonLd } from "@/components/JsonLd";
import { MemoCover } from "@/components/MemoCover";
import { Phrase } from "@/components/Phrase";
import { ShareButton } from "@/components/ShareButton";
import { ViewPing } from "@/components/ViewPing";
import { findTranslatedLocale, getArticle, listRelated } from "@/lib/articles";
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
  const [t, tCat, relatedRows] = await Promise.all([
    getTranslations("Article"),
    getTranslations("Category"),
    listRelated(locale, translation.article),
  ]);
  const related = await toFeedItems(relatedRows, locale);
  const { article } = translation;

  const keyPoints = asArray<string>(translation.keyPoints);
  const faq = asArray<Faq>(translation.faq);
  const hero = article.media[0];
  const categoryLabel = tCat(article.category);
  const dateFormat = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "Asia/Seoul" });
  const url = `${SITE_URL}${articlePath(locale, slug)}`;

  return (
    <>
      <AppHeader>
        <ShareButton title={translation.title} label={t("share")} copiedLabel={t("copied")} />
      </AppHeader>

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
          // 공식 이미지가 있으면 화면을 꽉 채우는 매거진 커버
          <figure className="relative aspect-[4/5] max-h-[78svh] w-full overflow-hidden">
            <Image src={hero.url} alt={translation.title} fill unoptimized priority sizes="100vw" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 px-5 pb-6 text-white">
              <span className="rounded-full bg-cherry px-2.5 py-1 font-label text-[11px] font-bold uppercase tracking-wide">
                {categoryLabel}
              </span>
              <h1 className="title mt-3 text-[28px] font-extrabold leading-[1.22]">
                <Phrase text={translation.title} locale={locale} />
              </h1>
              {hero.credit && <figcaption className="mt-2 text-[11px] text-white/70">{hero.credit}</figcaption>}
            </div>
          </figure>
        ) : (
          // 사진이 없으면 파스텔 메모 커버가 곧 제목
          <div className="px-3 pt-4">
            <div className="overflow-visible rounded-[28px] shadow-[0_10px_30px_-18px_rgba(27,21,32,0.35)] [&>div]:rounded-[28px]">
              <MemoCover
                title={translation.title}
                sticker={categoryLabel}
                stamp={dateStamp(article.publishedAt)}
                locale={locale}
                style={coverStyle(slug, article.category)}
                size="hero"
                as="h1"
                watermark={categoryLabel}
              />
            </div>
          </div>
        )}

        <div className="px-5">
          <p className="mt-5 flex flex-wrap gap-x-2 font-label text-[12px] text-muted">
            {article.publishedAt && (
              <time dateTime={article.publishedAt.toISOString()}>
                {t("published")} {dateFormat.format(article.publishedAt)}
              </time>
            )}
            <span aria-hidden>·</span>
            <time dateTime={article.updatedAt.toISOString()}>
              {t("updated")} {dateFormat.format(article.updatedAt)}
            </time>
          </p>

          <p className="mt-3 text-[17px] font-medium leading-[1.75]">{translation.summary}</p>

          {keyPoints.length > 0 && (
            <section
              className="tape relative mt-7 rotate-[-0.6deg] rounded-[6px] px-5 pb-5 pt-6 text-ink shadow-[0_8px_20px_-14px_rgba(27,21,32,0.4)]"
              style={{ backgroundColor: "var(--tint-kfood)" }}
            >
              <h2 className="font-display text-[22px] italic leading-none">{t("keyPoints")}</h2>
              <ol className="mt-3 space-y-2.5">
                {keyPoints.map((point, i) => (
                  <li key={point} className="flex gap-3 text-[15.5px] leading-[1.6]">
                    <span className="font-label text-[15px] font-extrabold text-[#d61b50]">{i + 1}</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ol>
            </section>
          )}

          <div className="article-body prose prose-neutral mt-8 max-w-none text-[17px] leading-[1.85] text-fg dark:prose-invert prose-headings:text-fg prose-h2:mt-10 prose-h2:text-[21px] prose-h2:font-extrabold prose-p:text-fg prose-a:text-cherry-deep prose-strong:text-fg prose-li:text-fg prose-table:text-[14px]">
            <ReactMarkdown>{translation.body}</ReactMarkdown>
          </div>
        </div>

        <AdSlot />

        <div className="px-5">
          {faq.length > 0 && (
            <section className="mt-4">
              <h2 className="font-display text-[24px] italic">{t("faq")}</h2>
              <div className="mt-3 divide-y divide-line overflow-hidden rounded-[18px] bg-card shadow-[inset_0_0_0_1px_var(--line)]">
                {faq.map((item) => (
                  <details key={item.q} className="faq group px-4">
                    <summary className="flex min-h-14 items-center gap-3 py-3 text-[15.5px] font-bold leading-snug">
                      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-cherry font-label text-[12px] text-white">
                        Q
                      </span>
                      <span className="flex-1">{item.q}</span>
                      <span className="faq-plus font-label text-[20px] text-muted transition-transform">+</span>
                    </summary>
                    <p className="pb-4 pl-9 text-[15px] leading-[1.75] text-fg/85">{item.a}</p>
                  </details>
                ))}
              </div>
            </section>
          )}

          {article.sources.length > 0 && (
            <section className="mt-8">
              <h2 className="font-label text-[12px] font-bold uppercase tracking-[0.16em] text-muted">{t("sources")}</h2>
              <ul className="mt-2 space-y-1.5 text-[14px]">
                {article.sources.map((source) => (
                  <li key={source.id}>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline decoration-line underline-offset-4"
                    >
                      {source.publisher}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <p className="mt-6 rounded-[12px] bg-card px-3.5 py-3 text-[12.5px] leading-relaxed text-muted shadow-[inset_0_0_0_1px_var(--line)]">
            {t("aiNotice")}
          </p>

          <Comments articleId={article.id} />
          <ViewPing articleId={article.id} />
        </div>

        {related.length > 0 && (
          <section className="mt-10">
            <h2 className="px-5 font-display text-[22px] italic">{t("related")}</h2>
            <div className="rail gap-3 px-4 pt-3">
              {related.map((item, i) => (
                <div key={item.slug} className="w-[158px]">
                  <FeedCard item={item} index={i} />
                </div>
              ))}
            </div>
          </section>
        )}
      </article>
    </>
  );
}
