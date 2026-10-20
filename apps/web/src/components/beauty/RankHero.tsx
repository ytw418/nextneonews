import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import { TypeCover } from "@/components/guide/TypeCover";
import { Words } from "@/components/guide/Words";
import { SaveButton } from "@/components/SaveButton";
import type { BeautyEntry } from "@/data/beauty";
import { beautyCover } from "@/data/cover";
import { isNew, SECTION_TINT } from "@/data/sections";
import { Link } from "@/i18n/navigation";

import { Price } from "./Price";

interface Props {
  entry: BeautyEntry;
  locale: string;
  rank?: number; // 어워드 1위: 포스터 숫자. 허브·테스트 결과는 숫자 없이 분류 이름이 주인공 (허브의 큰 '1' 이 전체 1위로 읽혔다)
  label?: string; // 분류 이름. 숫자가 있으면 숫자 옆 작은 글자, 없으면 맨 위 굵은 줄
  basis?: string; // 산식 한 줄: '편집 점수 + 독자 평가 n표 · 10.19 갱신'
  action?: ReactNode; // 카드 아래 구매 줄 (링크 밖 — 링크 안에 버튼을 넣지 않는다)
}

// 전폭 카드: 왼쪽 타이포 커버, 오른쪽 [숫자 또는 분류] · 브랜드 · 이름 · 가격 · 산식 한 줄. 저장은 오른쪽 위
export async function RankHero({ entry, locale, rank, label, basis, action }: Props) {
  const t = await getTranslations({ locale, namespace: "Beauty" });
  return (
    <li className="relative col-span-2 rounded-card bg-card shadow-card">
      <Link href={`/beauty/p/${entry.slug}`} className="press-soft flex gap-4 p-4">
        <TypeCover
          tint={SECTION_TINT.beauty}
          cover={beautyCover(entry)}
          isNew={isNew(entry.addedAt)}
          newLabel={t("newBadge")}
          locale={locale}
          className="w-32 shrink-0"
        />
        <span className="flex min-w-0 flex-1 flex-col">
          {rank ? (
            <span className="flex items-baseline gap-2 pr-9">
              <span aria-hidden className="numeral text-display text-ink-900">
                {rank}
              </span>
              <span className="sr-only">{t("rank", { rank })} </span>
              {label && <span className="min-w-0 truncate text-st12 font-semibold text-ink-600">{label}</span>}
            </span>
          ) : (
            label && <span className="pr-9 text-t5 font-bold text-brand-ink">{label}</span>
          )}
          <span className="mt-2 truncate text-st12 font-semibold text-ink-600">{entry.brand}</span>
          <span className="line-clamp-3 text-t4 leading-row font-bold text-ink-900">
            <Words text={entry.text.name} locale={locale} />
          </span>
          <Price tier={entry.priceTier} locale={locale} className="mt-1 text-t6 font-semibold text-ink-700" />
          {basis && <span className="mt-auto pt-2 text-st12 text-ink-600">{basis}</span>}
        </span>
      </Link>
      {action}
      <SaveButton kind="beauty" id={entry.slug} title={entry.text.name} className="absolute top-2 right-2" />
    </li>
  );
}
