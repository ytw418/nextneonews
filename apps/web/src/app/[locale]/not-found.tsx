import { type Locale, LOCALE_PATH_PREFIX } from "@kmedia/core";
import { getLocale, getTranslations } from "next-intl/server";

import { ErrorScreen } from "@/app/_error/ErrorScreen";

// 페이지가 notFound() 를 부를 때(없는 글·인물·카테고리). 레이아웃 안이라 탭바가 함께 보인다.
// 주소가 어느 화면에도 맞지 않거나 목록에 없는 상세 주소(dynamicParams=false)는 루트 app/not-found.tsx 가 정적으로 낸다
export default async function NotFound() {
  const [locale, t] = await Promise.all([getLocale(), getTranslations("ErrorPage")]);
  const home = LOCALE_PATH_PREFIX[locale as Locale] ?? LOCALE_PATH_PREFIX.en;

  return (
    <ErrorScreen
      code="404"
      text={{ title: t("notFoundTitle"), body: t("notFoundBody"), home: t("home"), guide: t("guide") }}
      homeHref={home}
      guideHref={`${home}/guide`}
    />
  );
}
