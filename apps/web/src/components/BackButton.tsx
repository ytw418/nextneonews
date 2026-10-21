"use client";

import { useTranslations } from "next-intl";

import { navDepth } from "@/components/ChromeEffects";
import { BackIcon } from "@/components/icons";
import { IconButton } from "@/components/ui/IconButton";
import { useRouter } from "@/i18n/navigation";
import { isApp, isAppPushed, postToApp } from "@/lib/app-mode";

// 뒤에 우리 사이트 기록이 있으면 그리로, 없으면(공유 링크로 바로 들어옴·홈 화면 실행) 상위 페이지로 바꿔 끼운다.
// 그래서 '뒤로'가 사이트 밖으로 나가거나 아무 일도 안 하는 경우가 없다.
// 언니노트 앱이 쌓아서 연 화면(저장함에서 연 항목)의 첫 페이지면 앱 화면을 닫는다 (앱 헤더의 뒤로와 두 개가 되지 않게 앱은 헤더를 숨긴다)
export function BackButton({ parentHref }: { parentHref: string }) {
  const t = useTranslations("Nav");
  const router = useRouter();

  return (
    <IconButton
      label={t("back")}
      onClick={() => {
        if (navDepth() > 0) router.back();
        else if (!(isApp() && isAppPushed() && postToApp({ type: "back" }))) router.replace(parentHref);
      }}
    >
      <BackIcon />
    </IconButton>
  );
}
