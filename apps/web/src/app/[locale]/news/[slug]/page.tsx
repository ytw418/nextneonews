import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import ReactMarkdown from "react-markdown";

import { getArticle } from "@/lib/articles";
import { articlePath } from "@/lib/url";

export const revalidate = 300;

// 글 페이지는 빌드 때 만들지 않고 첫 요청 때 만든 뒤 캐시한다.
export function generateStaticParams() {
  return [];
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

  return {
    title: translation.seoTitle ?? translation.title,
    description: translation.seoDesc ?? translation.summary,
    alternates: { canonical: articlePath(locale, slug), languages },
    robots: translation.indexable ? undefined : { index: false },
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

  return (
    <article>
      <h1 className="text-3xl font-bold leading-tight">{translation.title}</h1>
      <p className="mt-3 text-neutral-600 dark:text-neutral-400">{translation.summary}</p>

      <div className="prose mt-8 max-w-none dark:prose-invert">
        <ReactMarkdown>{translation.body}</ReactMarkdown>
      </div>

      {translation.article.sources.length > 0 && (
        <section className="mt-10 border-t border-neutral-200 pt-6 dark:border-neutral-800">
          <h2 className="mb-2 font-semibold">{t("sources")}</h2>
          <ul className="list-disc pl-5 text-sm">
            {translation.article.sources.map((source) => (
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
