"use client";

import { useTranslations } from "next-intl";

import { CheckIcon } from "@/components/icons";
import { useIsVisited } from "@/lib/saved";

// 명소 줄 썸네일 모서리의 '가 봤어요' 표시. 도장을 안 찍었으면 아무것도 그리지 않는다
export function VisitedMark({ slug }: { slug: string }) {
  const t = useTranslations("Travel.place");
  if (!useIsVisited(slug)) return null;
  return (
    <span className="absolute -top-1 -right-1 grid size-5 place-items-center rounded-full bg-brand text-white shadow-float">
      <CheckIcon className="size-3.5" />
      <span className="sr-only">{t("stampMark")}</span>
    </span>
  );
}
