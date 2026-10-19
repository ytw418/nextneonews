"use client";

import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/Badge";
import { useVisited } from "@/lib/saved";
import { stampProgress } from "@/lib/travel";

// 동네 타일 위 '내 도장 n/4' (이 기기에만 있는 도장이라 서버 렌더는 0, 하이드레이션 뒤 실제 수)
export function StampCount({ slugs, className = "" }: { slugs: string[]; className?: string }) {
  const t = useTranslations("Travel");
  const { done, total } = stampProgress(useVisited(), slugs);
  return (
    <Badge tone="paper" className={className}>
      {t("tileStamps", { done, total })}
    </Badge>
  );
}
