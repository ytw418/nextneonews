import createMiddleware from "next-intl/middleware";

import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // api, Next 내부 경로, 확장자가 있는 파일(sitemap.xml, robots.txt 등)은 제외
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
