"use client";

import { useTranslations } from "next-intl";

import { navDepth } from "@/components/ChromeEffects";
import { BackIcon } from "@/components/icons";
import { IconButton } from "@/components/ui/IconButton";
import { useRouter } from "@/i18n/navigation";

// 뒤에 우리 사이트 기록이 있으면 그리로, 없으면(공유 링크로 바로 들어옴·홈 화면 실행) 상위 페이지로 바꿔 끼운다.
// 그래서 '뒤로'가 사이트 밖으로 나가거나 아무 일도 안 하는 경우가 없다
export function BackButton({ parentHref }: { parentHref: string }) {
  const t = useTranslations("Nav");
  const router = useRouter();

  return (
    <IconButton label={t("back")} onClick={() => (navDepth() > 0 ? router.back() : router.replace(parentHref))}>
      <BackIcon />
    </IconButton>
  );
}
