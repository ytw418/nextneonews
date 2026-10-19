import { getTranslations } from "next-intl/server";

import { TypeCover } from "@/components/guide/TypeCover";
import { SaveButton } from "@/components/SaveButton";
import type { BeautyEntry } from "@/data/beauty";
import { isNew, SECTION_TINT } from "@/data/sections";
import { Link } from "@/i18n/navigation";
import { brandGlyph } from "@/lib/beauty";

import { Price } from "./Price";

interface Props {
  entry: BeautyEntry;
  locale: string;
  rank?: number; // 어워드 2·3위: 커버 왼쪽 위에 큰 숫자 (분류 배지 대신)
  label?: string; // 커버 왼쪽 위 작은 배지 (분류 이름)
}

// 2열 그리드 카드: 타이포 커버(분류·이름·브랜드가 커버 안에) + 아래 줄 [₩ · 맞는 피부 타입 … 하트].
// 저장 버튼은 링크 밖(형제)에 둔다 — 링크 안에 버튼을 넣으면 화면 읽기·키보드가 겹친다
export async function ProductCard({ entry, locale, rank, label }: Props) {
  const t = await getTranslations({ locale, namespace: "Beauty" });
  const skins = entry.skinTypes.map((s) => t(`skin.tag.${s}`)).join(t("listSep"));
  return (
    <li>
      <Link href={`/beauty/p/${entry.slug}`} className="press-soft block">
        {rank && <span className="sr-only">{t("rank", { rank })} </span>}
        <TypeCover
          tint={SECTION_TINT.beauty}
          glyph={brandGlyph(entry.brand)}
          label={rank ? undefined : label}
          title={entry.text.name}
          sub={entry.brand}
          // 분류 배지와 NEW 스티커가 좁은 커버 위에서 겹쳐서, 분류를 보이는 카드(허브·추천)는 스티커를 뺀다
          isNew={!label && isNew(entry.addedAt)}
          newLabel={t("newBadge")}
          locale={locale}
        >
          {rank && (
            <span aria-hidden className="numeral absolute top-1.5 left-3 text-display text-on-tint">
              {rank}
            </span>
          )}
        </TypeCover>
      </Link>
      <div className="flex items-center gap-1 pl-1">
        <p className="min-w-0 flex-1 truncate text-st12 text-ink-600">
          <Price
            tier={entry.priceTier}
            label={t(`priceTier.${entry.priceTier}`)}
            className="font-semibold text-ink-900"
          />{" "}
          · {skins}
        </p>
        <SaveButton kind="beauty" id={entry.slug} title={entry.text.name} className="-mr-2" />
      </div>
    </li>
  );
}
