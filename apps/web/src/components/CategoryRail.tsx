import { CATEGORIES, categorySlug } from "@kmedia/core";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";

export async function CategoryRail({ active }: { active?: string }) {
  const [tNav, tCat] = await Promise.all([getTranslations("Nav"), getTranslations("Category")]);
  const pill = (on: boolean) =>
    `rounded-full px-3.5 py-[7px] text-[13px] font-semibold transition-colors ${
      on ? "bg-fg text-bg" : "bg-card text-fg shadow-[inset_0_0_0_1px_var(--line)]"
    }`;

  return (
    <nav className="rail gap-2 px-4 py-3" aria-label="categories">
      <Link href="/" className={pill(!active)}>
        {tNav("all")}
      </Link>
      {CATEGORIES.map((c) => (
        <Link key={c} href={`/c/${categorySlug(c)}`} className={pill(active === c)}>
          {tCat(c)}
        </Link>
      ))}
    </nav>
  );
}
