import { getTranslations, setRequestLocale } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { listLatest } from "@/lib/articles";

export const revalidate = 300;

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [t, articles] = await Promise.all([getTranslations("Home"), listLatest(locale)]);

  return (
    <section>
      <h1 className="mb-6 text-2xl font-bold">{t("latest")}</h1>
      {articles.length === 0 ? (
        <p className="text-neutral-500">{t("empty")}</p>
      ) : (
        <ul className="space-y-6">
          {articles.map((item) => (
            <li key={item.slug}>
              <Link href={`/news/${item.slug}`} className="text-lg font-semibold hover:underline">
                {item.title}
              </Link>
              <p className="mt-1 text-neutral-600 dark:text-neutral-400">{item.summary}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
