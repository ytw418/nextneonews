import { CATEGORIES, categorySlug } from "@kmedia/core";
import Image from "next/image";
import { getTranslations } from "next-intl/server";

import { CATEGORY_ICON3D } from "@/data/icons3d";
import { Link } from "@/i18n/navigation";
import { listActiveCategories } from "@/lib/articles";

// 홈 상단 카테고리 메뉴: 회색 동그라미 + 3D 아이콘 + 이름 (여신티켓·강남언니의 아이콘 메뉴 문법).
// 홈은 곧 '전체' 라서 '전체' 칸은 두지 않는다. 카테고리 화면은 계속 알약 칩(CategoryRail)
export async function CategoryIcons({ locale }: { locale: string }) {
  const [tNav, tCat, withArticles] = await Promise.all([
    getTranslations("Nav"),
    getTranslations("Category"),
    listActiveCategories(locale),
  ]);
  const shown = CATEGORIES.filter((c) => withArticles.includes(c));
  if (shown.length === 0) return null;

  return (
    <nav className="rail gap-1 px-3 pt-2 pb-1" aria-label={tNav("categories")}>
      {shown.map((c) => (
        <Link
          key={c}
          href={`/c/${categorySlug(c)}`}
          className="press-soft flex w-[4.5rem] shrink-0 flex-col items-center gap-1.5 py-1"
        >
          <span className="grid size-15 place-items-center rounded-full bg-band">
            <Image src={CATEGORY_ICON3D[c]} unoptimized alt="" width={40} height={40} className="size-10" />
          </span>
          <span className="w-full truncate text-center text-st12 font-semibold text-ink-700">{tCat(c)}</span>
        </Link>
      ))}
    </nav>
  );
}
