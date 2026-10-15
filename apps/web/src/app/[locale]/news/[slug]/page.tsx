import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import ReactMarkdown from "react-markdown";

import { JsonLd } from "@/components/JsonLd";
import { getArticle } from "@/lib/articles";
import { articleJsonLd } from "@/lib/jsonld";
import { articlePath, localeHomePath, SITE_URL } from "@/lib/url";

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
  return {
    title: translation.seoTitle ?? translation.title,
    description,
    alternates: { canonical: articlePath(locale, slug), languages },
    robots: translation.indexable ? undefined : { index: false },
    openGraph: {
      type: "article",
      title: translation.title,
      description,
      publishedTime: translation.article.publishedAt?.toISOString(),
      modifiedTime: translation.article.updatedAt.toISOString(),
    },
  };
}

export default async function ArticlePage({ params }: PageProps<"/[locale]/news/[slug]">) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const translation = await getArticle(locale, slug);
  if (!translation) {
    notFound();
  }
  const t = await getTranslations("Article");
  const { article } = translation;

  const keyPoints = asArray<string>(translation.keyPoints);
  const faq = asArray<Faq>(translation.faq);
  const dateFormat = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "Asia/Seoul" });
  const url = `${SITE_URL}${articlePath(locale, slug)}`;

  return (
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
          homeUrl: `${SITE_URL}${localeHomePath(locale)}`,
        })}
      />

      <p className="text-sm text-neutral-500">
        {article.publishedAt && (
          <>
            {t("published")} <time dateTime={article.publishedAt.toISOString()}>{dateFormat.format(article.publishedAt)}</time>
          </>
        )}
        {" · "}
        {t("updated")} <time dateTime={article.updatedAt.toISOString()}>{dateFormat.format(article.updatedAt)}</time>
      </p>
      <h1 className="mt-2 text-3xl font-bold leading-tight">{translation.title}</h1>
      <p className="mt-3 text-neutral-600 dark:text-neutral-400">{translation.summary}</p>

      {keyPoints.length > 0 && (
        <section className="mt-6 border-l-4 border-neutral-900 pl-4 dark:border-neutral-100">
          <h2 className="font-semibold">{t("keyPoints")}</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {keyPoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </section>
      )}

      <div className="prose mt-8 max-w-none dark:prose-invert">
        <ReactMarkdown>{translation.body}</ReactMarkdown>
      </div>

      {faq.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-xl font-semibold">{t("faq")}</h2>
          <dl className="space-y-4">
            {faq.map((item) => (
              <div key={item.q}>
                <dt className="font-semibold">{item.q}</dt>
                <dd className="mt-1 text-neutral-700 dark:text-neutral-300">{item.a}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {article.sources.length > 0 && (
        <section className="mt-10 border-t border-neutral-200 pt-6 dark:border-neutral-800">
          <h2 className="mb-2 font-semibold">{t("sources")}</h2>
          <ul className="list-disc pl-5 text-sm">
            {article.sources.map((source) => (
              <li key={source.id}>
                <a href={source.url} target="_blank" rel="noopener noreferrer" className="underline">
                  {source.publisher}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="mt-10 text-xs text-neutral-500">{t("aiNotice")}</p>
    </article>
  );
}
