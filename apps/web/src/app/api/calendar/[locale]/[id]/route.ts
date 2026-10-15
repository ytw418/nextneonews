import { buildIcs, findEvent, isLocale, LOCALE_PATH_PREFIX, LOCALES, UPCOMING } from "@kmedia/core";
import { getTranslations } from "next-intl/server";

import { calendarLines } from "@/lib/schedule";
import { SITE_URL } from "@/lib/url";

// 캘린더 파일(.ics). 언어 미들웨어가 점 붙은 경로를 건너뛰고, 주소 접두사(/zh-tw)와 언어 코드(zh-TW)가 달라서
// /api 아래에 언어 코드로 둔다. 일정 파일이 바뀌면 배포로 다시 만든다
export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return LOCALES.flatMap((locale) => UPCOMING.map((e) => ({ locale, id: e.id })));
}

export async function GET(_request: Request, ctx: RouteContext<"/api/calendar/[locale]/[id]">) {
  const { locale, id } = await ctx.params;
  const e = findEvent(id);
  if (!isLocale(locale) || !e) return new Response("Not found", { status: 404 });

  const t = await getTranslations({ locale, namespace: "Schedule" });
  const body = buildIcs(e, locale, {
    url: `${SITE_URL}${LOCALE_PATH_PREFIX[locale]}/schedule/${id}`,
    host: new URL(SITE_URL).host,
    lines: calendarLines(e, t),
    dtstamp: new Date(),
  });
  return new Response(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      // download 대신 inline: iOS 사파리가 '캘린더에 추가' 미리보기를 띄운다
      "Content-Disposition": `inline; filename=${id}.ics`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
