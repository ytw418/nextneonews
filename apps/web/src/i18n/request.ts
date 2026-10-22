import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";

import { routing } from "./routing";

// 새 기능의 문구는 messages/ns/{네임스페이스}/{locale}.json 에 따로 둔다.
// 기능마다 자기 파일만 고치게 해서 messages/{locale}.json 에서 충돌이 나지 않게 한다
// 긴 본문(신뢰·제휴 고지·협찬 페이지)은 여기 넣지 않고 pages 패턴으로 그 화면에서만 읽는다 (InfoPage.tsx)
const NAMESPACES = [
  "Engage",
  "Rankings",
  "Feed",
  "Seo",
  "Trust",
  "Idol",
  "Guide",
  "Affiliate",
  "Beauty",
  "Travel",
  "Clinic",
  "Drama",
  "ErrorPage",
  "Today",
] as const;

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  const [base, ...parts] = await Promise.all([
    import(`../../messages/${locale}.json`),
    ...NAMESPACES.map((ns) => import(`../../messages/ns/${ns}/${locale}.json`)),
  ]);

  return {
    locale,
    messages: { ...base.default, ...Object.fromEntries(NAMESPACES.map((ns, i) => [ns, parts[i].default])) },
  };
});
