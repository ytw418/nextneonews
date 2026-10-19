"use client";

import { type Locale, LOCALE_PATH_PREFIX } from "@kmedia/core";
import { useLocale, useTranslations } from "next-intl";

import { ErrorScreen } from "@/app/_error/ErrorScreen";

// 화면을 그리다 실패했을 때(DB 조회 실패 등). 레이아웃 안이라 탭바가 함께 보이고, 캐시된 홈·가이드로 갈 수 있다.
// 레이아웃 자체가 실패하면(푸터의 카테고리 조회 등) app/global-error.tsx 가 대신 그린다
export default function LocaleError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const t = useTranslations("ErrorPage");
  const home = LOCALE_PATH_PREFIX[useLocale() as Locale] ?? LOCALE_PATH_PREFIX.en;

  return (
    <ErrorScreen
      code="500"
      text={{ title: t("errorTitle"), body: t("errorBody"), home: t("home"), guide: t("guide") }}
      homeHref={home}
      guideHref={`${home}/guide`}
      retry={{ label: t("retry"), onClick: retry }}
    />
  );
}
