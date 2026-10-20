import { getTranslations } from "next-intl/server";

import { TypeCover } from "@/components/guide/TypeCover";
import { SaveButton } from "@/components/SaveButton";
import type { BeautyEntry } from "@/data/beauty";
import { beautyCover } from "@/data/cover";
import { isNew, SECTION_TINT } from "@/data/sections";
import { Link } from "@/i18n/navigation";

import { Price } from "./Price";

interface Props {
  entry: BeautyEntry;
  locale: string;
  rank?: number; // 어워드 2·3위: 커버 왼쪽 위 순위 배지 (분류 배지 대신)
  label?: string; // 커버 왼쪽 위 작은 배지 (분류 이름)
  lead?: string; // 분류마다 한 장씩 늘어놓는 곳(허브·테스트 결과): 커버 위 굵은 분류 이름 + 낮은 커버(5:4)
}

// 2열 그리드 카드: 커버(대표 성분 3D 아이콘 + 분류·이름·브랜드) + 아래 [가격 / 맞는 피부 타입 … 하트].
// lead 가 있으면 분류 이름이 카드의 첫 글자다 — 같은 회색 카드가 이어져도 분류 이름과 성분 아이콘(달팽이·쌀…)으로 갈린다.
// 저장 버튼은 링크 밖(형제)에 둔다 — 링크 안에 버튼을 넣으면 화면 읽기·키보드가 겹친다
export async function ProductCard({ entry, locale, rank, label, lead }: Props) {
  const t = await getTranslations({ locale, namespace: "Beauty" });
  const skins = entry.skinTypes.map((s) => t(`skin.tag.${s}`)).join(t("listSep"));
  return (
    <li>
      <Link href={`/beauty/p/${entry.slug}`} className="press-soft block">
        {rank && <span className="sr-only">{t("rank", { rank })} </span>}
        {lead && <span className="mb-1.5 block truncate pl-1 text-t5 font-bold text-ink-900">{lead}</span>}
        <TypeCover
          tint={SECTION_TINT.beauty}
          cover={beautyCover(entry)}
          rank={rank}
          variant={lead ? "tile" : "grid"}
          label={rank || lead ? undefined : label}
          title={entry.text.name}
          sub={entry.brand}
          // 분류 배지와 NEW 스티커가 좁은 커버 위에서 겹쳐서, 분류를 보이는 카드(허브·추천)는 스티커를 뺀다
          isNew={!label && !lead && isNew(entry.addedAt)}
          newLabel={t("newBadge")}
          locale={locale}
        />
      </Link>
      {/* 가격은 범위 글자라 길다 — 피부 타입과 한 줄에 두면 피부 타입이 '…' 로만 남아 두 줄로 나눈다 */}
      <div className="flex items-start gap-1 pl-1">
        <p className="min-w-0 flex-1 pt-1.5 text-st12 text-ink-600">
          <Price tier={entry.priceTier} locale={locale} className="block font-semibold text-ink-900" />
          <span className="block truncate">{skins}</span>
        </p>
        <SaveButton kind="beauty" id={entry.slug} title={entry.text.name} className="-mr-2" />
      </div>
    </li>
  );
}
