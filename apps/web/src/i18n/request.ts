import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";

import { routing } from "./routing";

// 새 기능의 문구는 messages/ns/{네임스페이스}/{locale}.json 에 따로 둔다.
// 기능마다 자기 파일만 고치게 해서 messages/{locale}.json 에서 충돌이 나지 않게 한다
const NAMESPACES = ["Engage", "Rankings", "Feed", "Seo", "Trust", "Idol"] as const;

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
