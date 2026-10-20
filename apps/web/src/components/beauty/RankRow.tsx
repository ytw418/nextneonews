import { getTranslations } from "next-intl/server";

import { TypeCover } from "@/components/guide/TypeCover";
import { Words } from "@/components/guide/Words";
import { SaveButton } from "@/components/SaveButton";
import type { BeautyEntry } from "@/data/beauty";
import { beautyCover } from "@/data/cover";
import { SECTION_TINT } from "@/data/sections";
import { Link } from "@/i18n/navigation";

import { Price } from "./Price";

// 4위부터의 목록 한 줄: 순위 숫자 · 작은 커버 · 이름 / 브랜드 · 가격 · 맞는 피부 타입 · 오른쪽 하트.
// ListRow 와 같은 높이·구분선이지만 하트를 링크 밖에 두려고 따로 그린다 (링크 안 버튼 금지)
export async function RankRow({ entry, locale, rank }: { entry: BeautyEntry; locale: string; rank: number }) {
  const t = await getTranslations({ locale, namespace: "Beauty" });
  const skins = entry.skinTypes.map((s) => t(`skin.tag.${s}`)).join(t("listSep"));
  return (
    <li className="relative flex items-center gap-1 pr-3 after:absolute after:right-0 after:bottom-0 after:left-gutter after:h-px after:bg-line last:after:hidden">
      <Link href={`/beauty/p/${entry.slug}`} className="press-row flex min-h-14 min-w-0 flex-1 items-center gap-3 py-3 pl-gutter">
        <span aria-hidden className="w-7 shrink-0 text-center text-t4 font-bold tabular-nums text-ink-600">
          {rank}
        </span>
        <TypeCover tint={SECTION_TINT.beauty} cover={beautyCover(entry)} variant="square" className="size-14 shrink-0" />
        <span className="min-w-0 flex-1">
          <span className="sr-only">{t("rank", { rank })} </span>
          <span className="line-clamp-2 text-t5 leading-row font-bold text-ink-900">
            <Words text={entry.text.name} locale={locale} />
          </span>
          <span className="mt-0.5 block truncate text-t7 text-ink-600">
            {entry.brand} · <Price tier={entry.priceTier} locale={locale} /> · {skins}
          </span>
        </span>
      </Link>
      <SaveButton kind="beauty" id={entry.slug} title={entry.text.name} />
    </li>
  );
}
