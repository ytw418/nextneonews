"use client";

import { useTranslations } from "next-intl";

import { ChevronRightIcon } from "@/components/icons";
import { Link } from "@/i18n/navigation";

import { useSkinType } from "./useSkinType";

// 뷰티 h1 바로 아래 알약 하나: 피부 타입을 모르면 '6문항 테스트', 이미 했으면 내 타입 추천으로.
// 서버 렌더에는 테스트 쪽 (내 타입은 이 기기만 안다)
export function SkinTypeChip() {
  const t = useTranslations("Beauty");
  const skin = useSkinType();
  return (
    <Link
      href={skin ? `/beauty/skin-type/${skin}` : "/beauty/skin-type"}
      className="press hit mt-3 inline-flex min-h-[38px] items-center gap-0.5 rounded-full bg-brand-weak pr-2.5 pl-3.5 text-t6 font-semibold text-brand-ink"
    >
      {skin ? t("skinChipMine", { skin: t(`skin.short.${skin}`) }) : t("skinChip")}
      <ChevronRightIcon className="size-4" />
    </Link>
  );
}
