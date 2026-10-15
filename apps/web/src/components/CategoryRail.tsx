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
  const pill = (on: boolean) =>
    `rounded-full px-3.5 py-[7px] text-[13px] font-semibold transition-colors ${
      on ? "bg-fg text-bg" : "bg-card text-fg shadow-[inset_0_0_0_1px_var(--line)]"
    }`;

  return (
    <nav className="rail gap-2 px-4 py-3" aria-label="categories">
      <Link href="/" className={pill(!active)}>
        {tNav("all")}
      </Link>
      {shown.map((c) => (
        <Link key={c} href={`/c/${categorySlug(c)}`} className={pill(active === c)}>
          {tCat(c)}
        </Link>
      ))}
    </nav>
  );
}
