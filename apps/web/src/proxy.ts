import { type NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";

import { routing } from "./i18n/routing";

const intl = createMiddleware(routing);

// 주소 경로의 널 문자(%00). Postgres 가 text 칸의 0x00 을 거부해 글·인물 페이지가 500 을 냈다 (docs/predeploy/qa-nul-byte.md).
// 운영은 Vercel 엣지가 먼저 400 으로 막지만, 어디서 돌든 렌더링·DB 까지 가지 않게 여기서 400 으로 끊는다
const NUL = /%00|\0/;

export default function proxy(request: NextRequest) {
  // nextUrl 은 쓰지 않는다: 끝 / 를 다시 붙여 같은 주소로 계속 보낸다
  const url = new URL(request.url);
  if (NUL.test(url.pathname)) return new NextResponse(null, { status: 400 });
  // 끝 / 를 떼는 Next 기본 이동은 PostHog 중계 때문에 껐다(next.config.ts skipTrailingSlashRedirect). 페이지 주소에서만 되살린다
  if (url.pathname.length > 1 && url.pathname.endsWith("/")) {
    url.pathname = url.pathname.replace(/\/+$/, "");
    return NextResponse.redirect(url, 308);
  }
  return intl(request);
}

export const config = {
  // api, PostHog 중계(relay, next.config.ts), Next 내부 경로, 아이콘·공유 이미지, 확장자가 있는 파일(sitemap.xml, robots.txt 등)은 제외
  matcher: "/((?!api|relay|_next|_vercel|apple-icon|icon|.*\\..*).*)",
};
