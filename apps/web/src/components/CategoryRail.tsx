import { CATEGORIES, categorySlug } from "@kmedia/core";
import { getLocale, getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { listActiveCategories } from "@/lib/articles";

export async function CategoryRail({ active }: { active?: string }) {
  const locale = await getLocale();
  const [tNav, tCat, withArticles] = await Promise.all([
    getTranslations("Nav"),
    getTranslations("Category"),
    listActiveCategories(locale),
  ]);
  const shown = CATEGORIES.filter((c) => withArticles.includes(c) || c === active);
  // 칩은 38px, 누름 영역은 44px. 선택한 칩이 상단에서 유일한 채운(브랜드) 요소다
  const chip = (on: boolean) =>
    `press hit relative inline-flex min-h-[38px] min-w-16 items-center justify-center whitespace-nowrap rounded-full px-3.5 text-t6 ${
      on ? "bg-brand font-bold text-white" : "bg-card font-semibold text-ink-700 ring-1 ring-line ring-inset"
    }`;

  return (
    <nav className="rail gap-2 px-gutter py-2" aria-label="categories">
      <Link href="/" data-chip aria-current={!active ? "page" : undefined} className={chip(!active)}>
        {tNav("all")}
      </Link>
      {shown.map((c) => (
        <Link
          key={c}
          href={`/c/${categorySlug(c)}`}
          data-chip
          aria-current={active === c ? "page" : undefined}
          className={chip(active === c)}
        >
          {tCat(c)}
        </Link>
      ))}
    </nav>
  );
}
