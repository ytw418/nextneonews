import { LOCALES, SITE_NAME } from "@kmedia/core";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";

const LOCALE_LABEL: Record<(typeof LOCALES)[number], string> = {
  en: "EN",
  ja: "日本語",
  "zh-TW": "繁中",
  ko: "한국어",
};

export async function Header() {
  const t = await getTranslations("Nav");

  return (
    <header className="border-b border-neutral-200 dark:border-neutral-800">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-bold">
          {SITE_NAME}
        </Link>
        <nav aria-label={t("language")} className="flex gap-3 text-sm">
          {LOCALES.map((locale) => (
            <Link key={locale} href="/" locale={locale} className="hover:underline">
              {LOCALE_LABEL[locale]}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
