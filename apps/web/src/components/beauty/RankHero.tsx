import { getTranslations } from "next-intl/server";

import { TypeCover } from "@/components/guide/TypeCover";
import { Words } from "@/components/guide/Words";
import { SaveButton } from "@/components/SaveButton";
import type { BeautyEntry } from "@/data/beauty";
import { isNew, SECTION_TINT } from "@/data/sections";
import { Link } from "@/i18n/navigation";
import { brandGlyph } from "@/lib/beauty";

import { Price } from "./Price";

interface Props {
  entry: BeautyEntry;
  locale: string;
  label?: string; // 숫자 옆 분류 이름 (허브)
  basis: string; // 산식 한 줄: '편집 점수 + 독자 평가 n표 · 10.19 갱신'
}

// 1위 카드 (전폭): 왼쪽 타이포 커버, 오른쪽 포스터 숫자 1 · 브랜드 · 이름 · ₩ · 산식 한 줄. 저장은 오른쪽 위
export async function RankHero({ entry, locale, label, basis }: Props) {
  const t = await getTranslations({ locale, namespace: "Beauty" });
  return (
    <li className="relative col-span-2 rounded-card bg-card shadow-card">
      <Link href={`/beauty/p/${entry.slug}`} className="press-soft flex gap-4 p-4">
        <TypeCover
          tint={SECTION_TINT.beauty}
          glyph={brandGlyph(entry.brand)}
          isNew={isNew(entry.addedAt)}
          newLabel={t("newBadge")}
          locale={locale}
          className="w-32 shrink-0"
        />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="flex items-baseline gap-2 pr-9">
            <span aria-hidden className="numeral text-display text-ink-900">
              1
            </span>
            <span className="sr-only">{t("rank", { rank: 1 })} </span>
            {label && <span className="min-w-0 truncate text-st12 font-semibold text-ink-600">{label}</span>}
          </span>
          <span className="mt-2 truncate text-st12 font-semibold text-ink-600">{entry.brand}</span>
          <span className="line-clamp-3 text-t4 leading-row font-bold text-ink-900">
            <Words text={entry.text.name} locale={locale} />
          </span>
          <Price
            tier={entry.priceTier}
            label={t(`priceTier.${entry.priceTier}`)}
            className="mt-1 text-t6 font-semibold text-ink-700"
          />
          <span className="mt-auto pt-2 text-st12 text-ink-600">{basis}</span>
        </span>
      </Link>
      <SaveButton kind="beauty" id={entry.slug} title={entry.text.name} className="absolute top-2 right-2" />
    </li>
  );
}
